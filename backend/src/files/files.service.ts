import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { AuthService } from '../auth/auth.service';
import { CryptoService } from '../common/services/crypto.service';
import { MoveFileDto, BatchMoveFilesDto, RenameFileDto, BatchDeleteFilesDto } from './dto/file.dto';
import { File as PrismaFile } from '@prisma/client';

export interface SerializedFile {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  messageId: string;
  folderId: string | null;
  userId: string;
  isFavorite: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UserKeys {
  canonical: Buffer;
  legacy: Buffer;
}

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
    private authService: AuthService,
    private cryptoService: CryptoService,
  ) { }

  /**
   * Gets the encryption keys for a user.
   * Returns both Canonical (derived from decrypted session) 
   * and Legacy (derived from raw/encrypted session) keys.
   */
  private async getUserKeys(userId: string): Promise<UserKeys> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Canonical Key: Derived from DECRYPTED session string (Stable, Correct)
    const rawSessionString = this.cryptoService.decryptSession(user.sessionString);
    const canonical = this.cryptoService.deriveKeyFromSession(rawSessionString);

    // Legacy Key: Derived from ENCRYPTED session string (Fallback for existing data)
    // This handles data that was encrypted before the session decryption fix was applied.
    const legacy = this.cryptoService.deriveKeyFromSession(user.sessionString);

    return { canonical, legacy };
  }

  private encryptName(name: string, keys: UserKeys): string {
    // Always encrypt using the Canonical key for new/updated data
    return this.cryptoService.encryptMetadata(name, keys.canonical);
  }

  private decryptName(encryptedName: string, keys: UserKeys): string {
    // 1. Try Canonical Key
    const val = this.cryptoService.decryptMetadata(encryptedName, keys.canonical);

    // 2. If decryption failed (returns input), try Legacy Key
    if (val === encryptedName) {
      return this.cryptoService.decryptMetadata(encryptedName, keys.legacy);
    }

    return val;
  }

  async findAll(userId: string, folderId?: string | null) {
    const userKeys = await this.getUserKeys(userId);
    const files = await this.prisma.file.findMany({
      where: {
        userId,
        folderId: folderId === undefined ? undefined : folderId,
        deletedAt: null, // Exclude trashed files
      },
      orderBy: { createdAt: 'desc' }, // Sort by date since names are encrypted
    });
    return files.map(f => this.serializeFileWithDecryption(f, userKeys));
  }

  async findOne(id: string, userId: string) {
    const userKeys = await this.getUserKeys(userId);
    const file = await this.findOneRaw(id, userId);
    return this.serializeFileWithDecryption(file, userKeys);
  }

  private async findOneRaw(id: string, userId: string) {
    const file = await this.prisma.file.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }

  private async findOneRawIncludingTrashed(id: string, userId: string) {
    const file = await this.prisma.file.findFirst({
      where: { id, userId },
    });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }

  async upload(
    userId: string,
    file: Express.Multer.File,
    folderId?: string,
  ) {
    const userKeys = await this.getUserKeys(userId);
    const client = await this.authService.getClientForUser(userId);

    try {
      const message = await this.telegramService.uploadFile(
        client,
        file.buffer,
        file.originalname,
        file.mimetype,
      );

      // Encrypt the filename before storing (using Canonical key)
      const encryptedName = this.encryptName(file.originalname, userKeys);

      const dbFile = await this.prisma.file.create({
        data: {
          name: encryptedName,
          size: BigInt(file.size),
          mimeType: file.mimetype,
          messageId: BigInt(message.id),
          folderId: folderId || null,
          userId,
        },
      });

      return this.serializeFileWithDecryption(dbFile, userKeys);
    } finally {
      await client.disconnect();
    }
  }

  async download(id: string, userId: string): Promise<{ buffer: Buffer; file: SerializedFile }> {
    const userKeys = await this.getUserKeys(userId);
    const file = await this.findOneRaw(id, userId);
    const client = await this.authService.getClientForUser(userId);

    try {
      const buffer = await this.telegramService.downloadFile(
        client,
        Number(file.messageId),
      );
      return { buffer, file: this.serializeFileWithDecryption(file, userKeys) };
    } finally {
      await client.disconnect();
    }
  }

  async move(id: string, userId: string, dto: MoveFileDto) {
    const userKeys = await this.getUserKeys(userId);
    await this.findOneRaw(id, userId);
    const updated = await this.prisma.file.update({
      where: { id },
      data: { folderId: dto.folderId || null },
    });
    return this.serializeFileWithDecryption(updated, userKeys);
  }

  async batchMove(userId: string, dto: BatchMoveFilesDto) {
    // Verify all files belong to user
    const files = await this.prisma.file.findMany({
      where: { id: { in: dto.fileIds }, userId },
    });
    if (files.length !== dto.fileIds.length) {
      throw new NotFoundException('One or more files not found');
    }

    await this.prisma.file.updateMany({
      where: { id: { in: dto.fileIds }, userId },
      data: { folderId: dto.folderId || null },
    });

    return { count: dto.fileIds.length };
  }

  async rename(id: string, userId: string, dto: RenameFileDto) {
    const userKeys = await this.getUserKeys(userId);
    await this.findOneRaw(id, userId);
    // Encrypt the new name before storing
    const encryptedName = this.encryptName(dto.name, userKeys);
    const updated = await this.prisma.file.update({
      where: { id },
      data: { name: encryptedName },
    });
    return this.serializeFileWithDecryption(updated, userKeys);
  }

  async remove(id: string, userId: string) {
    const userKeys = await this.getUserKeys(userId);
    await this.findOneRaw(id, userId);
    // Soft delete - move to trash
    const updated = await this.prisma.file.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return this.serializeFileWithDecryption(updated, userKeys);
  }

  async batchDelete(userId: string, dto: BatchDeleteFilesDto) {
    const userKeys = await this.getUserKeys(userId);
    // Verify all files belong to user and are not already deleted
    const files = await this.prisma.file.findMany({
      where: { id: { in: dto.fileIds }, userId, deletedAt: null },
    });
    if (files.length !== dto.fileIds.length) {
      throw new NotFoundException('One or more files not found');
    }

    // Soft delete - move to trash
    await this.prisma.file.updateMany({
      where: { id: { in: dto.fileIds }, userId },
      data: { deletedAt: new Date() },
    });

    return { count: dto.fileIds.length };
  }

  // Trash methods
  async findTrashed(userId: string) {
    const userKeys = await this.getUserKeys(userId);
    const files = await this.prisma.file.findMany({
      where: { userId, deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    });
    return files.map(f => this.serializeFileWithDecryption(f, userKeys));
  }

  async restore(id: string, userId: string) {
    const userKeys = await this.getUserKeys(userId);
    const file = await this.findOneRawIncludingTrashed(id, userId);
    if (!file.deletedAt) {
      throw new NotFoundException('File is not in trash');
    }
    const updated = await this.prisma.file.update({
      where: { id },
      data: { deletedAt: null },
    });
    return this.serializeFileWithDecryption(updated, userKeys);
  }

  async permanentDelete(id: string, userId: string) {
    const file = await this.findOneRawIncludingTrashed(id, userId);
    if (!file.deletedAt) {
      throw new NotFoundException('File must be in trash before permanent deletion');
    }

    const client = await this.authService.getClientForUser(userId);
    try {
      await this.telegramService.deleteMessage(client, Number(file.messageId));
      await this.prisma.file.delete({ where: { id } });
      return { success: true };
    } finally {
      await client.disconnect();
    }
  }

  async emptyTrash(userId: string) {
    const trashedFiles = await this.prisma.file.findMany({
      where: { userId, deletedAt: { not: null } },
    });

    if (trashedFiles.length === 0) {
      return { count: 0 };
    }

    const client = await this.authService.getClientForUser(userId);
    try {
      // Delete from Telegram
      for (const file of trashedFiles) {
        try {
          await this.telegramService.deleteMessage(client, Number(file.messageId));
        } catch {
          // Continue even if Telegram delete fails
        }
      }

      // Delete from database
      await this.prisma.file.deleteMany({
        where: { userId, deletedAt: { not: null } },
      });

      return { count: trashedFiles.length };
    } finally {
      await client.disconnect();
    }
  }

  async search(userId: string, query: string) {
    // Since names are encrypted, we need to decrypt and filter client-side
    const userKeys = await this.getUserKeys(userId);
    const files = await this.prisma.file.findMany({
      where: {
        userId,
        deletedAt: null,
      },
    });

    // Decrypt names and filter by query
    const lowerQuery = query.toLowerCase();
    return files
      .map(f => this.serializeFileWithDecryption(f, userKeys))
      .filter(f => f.name.toLowerCase().includes(lowerQuery))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findFavorites(userId: string) {
    const userKeys = await this.getUserKeys(userId);
    const files = await this.prisma.file.findMany({
      where: { userId, isFavorite: true, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return files.map(f => this.serializeFileWithDecryption(f, userKeys));
  }

  async toggleFavorite(id: string, userId: string) {
    const userKeys = await this.getUserKeys(userId);
    const file = await this.findOneRaw(id, userId);
    const updated = await this.prisma.file.update({
      where: { id },
      data: { isFavorite: !file.isFavorite },
    });
    return this.serializeFileWithDecryption(updated, userKeys);
  }

  private serializeFile(file: PrismaFile): SerializedFile {
    return {
      ...file,
      size: file.size.toString(),
      messageId: file.messageId.toString(),
    };
  }

  private serializeFileWithDecryption(file: PrismaFile, keys: UserKeys): SerializedFile {
    return {
      ...file,
      name: this.decryptName(file.name, keys),
      size: file.size.toString(),
      messageId: file.messageId.toString(),
    };
  }
}
