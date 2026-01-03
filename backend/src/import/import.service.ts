import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { AuthService } from '../auth/auth.service';
import { CryptoService } from '../common/services/crypto.service';
import { Api } from 'telegram';
import { ImportFilesDto, ImportSingleFileDto } from './dto/import.dto';

export interface DialogInfo {
  id: string;
  name: string;
  type: 'user' | 'group' | 'channel' | 'saved';
  photoUrl?: string;
}

export interface FileInfo {
  messageId: number;
  name: string;
  size: number;
  mimeType: string;
  date: Date;
}

@Injectable()
export class ImportService {
  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
    private authService: AuthService,
    private cryptoService: CryptoService,
  ) { }

  /**
   * Gets the encryption key for a user by deriving it from their session string.
   */
  private async getUserKey(userId: string): Promise<Buffer> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Decrypt the session string first to get a stable key source
    const rawSessionString = this.cryptoService.decryptSession(user.sessionString);
    return this.cryptoService.deriveKeyFromSession(rawSessionString);
  }

  private encryptName(name: string, userKey: Buffer): string {
    return this.cryptoService.encryptMetadata(name, userKey);
  }

  private decryptName(encryptedName: string, userKey: Buffer): string {
    return this.cryptoService.decryptMetadata(encryptedName, userKey);
  }

  async getDialogs(userId: string): Promise<DialogInfo[]> {
    const client = await this.authService.getClientForUser(userId);

    try {
      console.log('Fetching dialogs for user:', userId);
      const dialogs = await this.telegramService.getDialogs(client);
      console.log('Dialogs fetched:', dialogs.length);

      const dialogInfos: DialogInfo[] = [];

      // Add Saved Messages first
      dialogInfos.push({
        id: 'me',
        name: 'Saved Messages',
        type: 'saved',
      });

      for (const dialog of dialogs) {
        try {
          const entity = (dialog as any).entity;

          if (entity instanceof Api.User) {
            if (entity.self) continue; // Skip self (already added as Saved Messages)
            dialogInfos.push({
              id: entity.id.toString(),
              name: this.getUserName(entity),
              type: 'user',
            });
          } else if (entity instanceof Api.Chat || entity instanceof Api.Channel) {
            dialogInfos.push({
              id: entity.id.toString(),
              name: entity.title || 'Unknown',
              type: entity instanceof Api.Channel ? 'channel' : 'group',
            });
          }
        } catch (err) {
          console.error('Error processing dialog:', err);
          // Skip this dialog and continue
        }
      }

      console.log('Processed dialogs:', dialogInfos.length);
      return dialogInfos;
    } catch (error) {
      console.error('Error in getDialogs:', error);
      throw error;
    } finally {
      await client.disconnect();
    }
  }

  async getDialogFiles(
    userId: string,
    chatId: string,
    chatType: 'user' | 'group' | 'channel' | 'saved',
    limit = 100,
  ): Promise<FileInfo[]> {
    const client = await this.authService.getClientForUser(userId);

    try {
      const messages = await this.telegramService.getMessagesFromChat(
        client,
        chatId,
        chatType,
        limit,
      );

      const fileInfos: FileInfo[] = [];

      for (const message of messages) {
        if (!message.media) continue;

        const fileInfo = this.extractFileInfo(message);
        if (fileInfo) {
          fileInfos.push(fileInfo);
        }
      }

      return fileInfos;
    } finally {
      await client.disconnect();
    }
  }

  async importFiles(userId: string, dto: ImportFilesDto) {
    console.log('Starting import for user:', userId);
    console.log('Import DTO:', dto);

    const userKey = await this.getUserKey(userId);
    const client = await this.authService.getClientForUser(userId);

    try {
      // 1. Create or get folder with chat name (encrypted)
      const encryptedChatName = this.encryptName(dto.chatName, userKey);

      // Search for existing folder by decrypting all folder names
      const existingFolders = await this.prisma.folder.findMany({
        where: { userId, parentId: null },
      });

      let folder = existingFolders.find(f =>
        this.decryptName(f.name, userKey) === dto.chatName
      );

      if (!folder) {
        console.log('Creating folder:', dto.chatName);
        folder = await this.prisma.folder.create({
          data: {
            name: encryptedChatName,
            userId,
          },
        });
      } else {
        console.log('Using existing folder:', folder.id);
      }

      // 2. Forward messages to Saved Messages
      console.log('Forwarding messages:', dto.messageIds);
      const forwardedMessages = await this.telegramService.forwardToSavedMessages(
        client,
        dto.chatId,
        dto.chatType,
        dto.messageIds,
      );
      console.log('Forwarded messages count:', forwardedMessages.length);

      // 3. Create file records in database with encrypted names
      const createdFiles = [];
      for (const message of forwardedMessages) {
        if (!message.media) {
          console.log('Message has no media, skipping:', message.id);
          continue;
        }

        const fileInfo = this.extractFileInfo(message);
        if (!fileInfo) {
          console.log('Could not extract file info, skipping:', message.id);
          continue;
        }

        console.log('Creating file record:', fileInfo.name);
        const encryptedFileName = this.encryptName(fileInfo.name, userKey);
        const file = await this.prisma.file.create({
          data: {
            name: encryptedFileName,
            size: BigInt(fileInfo.size),
            mimeType: fileInfo.mimeType,
            messageId: BigInt(message.id),
            folderId: folder.id,
            userId,
          },
        });

        createdFiles.push({
          ...file,
          name: fileInfo.name, // Return decrypted name
          size: file.size.toString(),
          messageId: file.messageId.toString(),
        });
      }

      console.log('Import complete. Files created:', createdFiles.length);

      return {
        folder: {
          id: folder.id,
          name: dto.chatName, // Return decrypted name
        },
        files: createdFiles,
        count: createdFiles.length,
      };
    } catch (error) {
      console.error('Error in importFiles:', error);
      throw error;
    } finally {
      await client.disconnect();
    }
  }

  async importSingleFile(userId: string, dto: ImportSingleFileDto) {
    const userKey = await this.getUserKey(userId);
    const client = await this.authService.getClientForUser(userId);

    try {
      // 1. Create or get folder with chat name (encrypted)
      const encryptedChatName = this.encryptName(dto.chatName, userKey);

      // Search for existing folder by decrypting all folder names
      const existingFolders = await this.prisma.folder.findMany({
        where: { userId, parentId: null },
      });

      let folder = existingFolders.find(f =>
        this.decryptName(f.name, userKey) === dto.chatName
      );

      if (!folder) {
        folder = await this.prisma.folder.create({
          data: {
            name: encryptedChatName,
            userId,
          },
        });
      }

      // 2. Get the entity for the source chat
      let targetEntity: any;

      if (dto.chatType === 'saved' || dto.chatId === 'me') {
        targetEntity = new Api.InputPeerSelf();
      } else {
        const dialogs = await client.getDialogs({ limit: 100 });

        let foundEntity: any = null;
        for (const dialog of dialogs) {
          const entity = (dialog as any).entity;
          if (entity && entity.id && entity.id.toString() === dto.chatId) {
            foundEntity = entity;
            break;
          }
        }

        if (!foundEntity) {
          throw new Error(`Chat not found: ${dto.chatId}`);
        }
        targetEntity = foundEntity;
      }

      // 3. Get the original message
      const originalMessages = await client.getMessages(targetEntity, { ids: [dto.messageId] });
      if (!originalMessages.length || !originalMessages[0].media) {
        throw new Error('Message or media not found');
      }

      const msg = originalMessages[0];
      const media = msg.media!;

      // 4. Download the media
      const buffer = await client.downloadMedia(media);
      if (!buffer) {
        throw new Error('Failed to download media');
      }

      // 5. Extract file info
      let fileName = 'file';
      if (media instanceof Api.MessageMediaDocument) {
        const doc = media.document;
        if (doc instanceof Api.Document) {
          for (const attr of doc.attributes) {
            if (attr instanceof Api.DocumentAttributeFilename) {
              fileName = attr.fileName;
              break;
            }
          }
        }
      } else if (media instanceof Api.MessageMediaPhoto) {
        fileName = `photo_${msg.id}.jpg`;
      }

      // 6. Re-upload to Saved Messages
      const result = await client.sendFile('me', {
        file: buffer as Buffer,
        caption: fileName,
        forceDocument: true,
        attributes: [
          new Api.DocumentAttributeFilename({ fileName }),
        ],
      });

      // 7. Extract file info from uploaded message
      const fileInfo = this.extractFileInfo(result);
      if (!fileInfo) {
        throw new Error('Failed to extract file info from uploaded message');
      }

      // 8. Create file record in database with encrypted name
      const encryptedFileName = this.encryptName(fileInfo.name, userKey);
      const file = await this.prisma.file.create({
        data: {
          name: encryptedFileName,
          size: BigInt(fileInfo.size),
          mimeType: fileInfo.mimeType,
          messageId: BigInt(result.id),
          folderId: folder.id,
          userId,
        },
      });

      return {
        success: true,
        folder: {
          id: folder.id,
          name: dto.chatName, // Return decrypted name
        },
        file: {
          ...file,
          name: fileInfo.name, // Return decrypted name
          size: file.size.toString(),
          messageId: file.messageId.toString(),
        },
      };
    } catch (error) {
      console.error('Error in importSingleFile:', error);
      throw error;
    } finally {
      await client.disconnect();
    }
  }

  private getUserName(user: Api.User): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    if (user.username) return `@${user.username}`;
    return 'Unknown User';
  }

  private extractFileInfo(message: Api.Message): FileInfo | null {
    if (!message.media) return null;

    let name = 'Unknown';
    let size = 0;
    let mimeType = 'application/octet-stream';

    if (message.media instanceof Api.MessageMediaDocument) {
      const doc = message.media.document;
      if (doc instanceof Api.Document) {
        size = Number(doc.size);
        mimeType = doc.mimeType || mimeType;

        // Extract filename from attributes
        for (const attr of doc.attributes) {
          if (attr instanceof Api.DocumentAttributeFilename) {
            name = attr.fileName;
            break;
          }
        }

        // If mimeType is generic, try to detect from filename extension
        if (mimeType === 'application/octet-stream' && name !== 'Unknown') {
          mimeType = this.getMimeTypeFromFilename(name) || mimeType;
        }
      }
    } else if (message.media instanceof Api.MessageMediaPhoto) {
      const photo = message.media.photo;
      if (photo instanceof Api.Photo) {
        name = `photo_${message.id}.jpg`;
        mimeType = 'image/jpeg';
        // Estimate size from largest photo size
        const sizes = photo.sizes;
        if (sizes.length > 0) {
          const largest = sizes[sizes.length - 1];
          if ('size' in largest) {
            size = Number(largest.size);
          }
        }
      }
    }

    return {
      messageId: message.id,
      name,
      size,
      mimeType,
      date: new Date(message.date * 1000),
    };
  }

  private getMimeTypeFromFilename(filename: string): string | null {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (!ext) return null;

    const mimeTypes: Record<string, string> = {
      // Images
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
      'ico': 'image/x-icon',
      // Videos
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'mkv': 'video/x-matroska',
      // Audio
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac',
      'm4a': 'audio/mp4',
      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Text
      'txt': 'text/plain',
      'json': 'application/json',
      'xml': 'text/xml',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'text/javascript',
      'ts': 'text/typescript',
      'md': 'text/markdown',
      // Archives
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      'tar': 'application/x-tar',
      'gz': 'application/gzip',
    };

    return mimeTypes[ext] || null;
  }
}
