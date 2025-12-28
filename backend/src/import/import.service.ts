import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { AuthService } from '../auth/auth.service';
import { Api } from 'telegram';
import { ImportFilesDto } from './dto/import.dto';

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
  ) {}

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
    limit = 100,
  ): Promise<FileInfo[]> {
    const client = await this.authService.getClientForUser(userId);

    try {
      const messages = await this.telegramService.getMessagesFromChat(
        client,
        chatId,
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
    
    const client = await this.authService.getClientForUser(userId);

    try {
      // 1. Create or get folder with chat name
      let folder = await this.prisma.folder.findFirst({
        where: {
          userId,
          name: dto.chatName,
          parentId: null,
        },
      });

      if (!folder) {
        console.log('Creating folder:', dto.chatName);
        folder = await this.prisma.folder.create({
          data: {
            name: dto.chatName,
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
        dto.messageIds,
      );
      console.log('Forwarded messages count:', forwardedMessages.length);

      // 3. Create file records in database
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
        const file = await this.prisma.file.create({
          data: {
            name: fileInfo.name,
            size: BigInt(fileInfo.size),
            mimeType: fileInfo.mimeType,
            messageId: BigInt(message.id),
            folderId: folder.id,
            userId,
          },
        });

        createdFiles.push({
          ...file,
          size: file.size.toString(),
          messageId: file.messageId.toString(),
        });
      }

      console.log('Import complete. Files created:', createdFiles.length);

      return {
        folder: {
          id: folder.id,
          name: folder.name,
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
