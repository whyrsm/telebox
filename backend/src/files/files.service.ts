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

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
    private authService: AuthService,
    private cryptoService: CryptoService,
  ) { }

  /**
   * Gets the encryption key for a user by deriving it from their session string.
   * This ensures each user has a unique key that the developer cannot access.
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

  async findAll(userId: string, folderId?: string | null) {
    const userKey = await this.getUserKey(userId);
    const files = await this.prisma.file.findMany({
      where: {
        userId,
        folderId: folderId === undefined ? undefined : folderId,
        deletedAt: null, // Exclude trashed files
      },
      orderBy: { createdAt: 'desc' }, // Sort by date since names are encrypted
    });
    return files.map(f => this.serializeFileWithDecryption(f, userKey));
  }

  async findOne(id: string, userId: string) {
    const userKey = await this.getUserKey(userId);
    const file = await this.findOneRaw(id, userId);
    return this.serializeFileWithDecryption(file, userKey);
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
    const userKey = await this.getUserKey(userId);
    const client = await this.authService.getClientForUser(userId);

    try {
      const message = await this.telegramService.uploadFile(
        client,
        file.buffer,
        file.originalname,
        file.mimetype,
      );

      // Encrypt the filename before storing
      const encryptedName = this.encryptName(file.originalname, userKey);

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

      return this.serializeFileWithDecryption(dbFile, userKey);
    } finally {
      await client.disconnect();
    }
  }

  async download(id: string, userId: string): Promise<{ buffer: Buffer; file: SerializedFile }> {
    const userKey = await this.getUserKey(userId);
    const file = await this.findOneRaw(id, userId);
    const client = await this.authService.getClientForUser(userId);

    try {
      const buffer = await this.telegramService.downloadFile(
        client,
        Number(file.messageId),
      );
      return { buffer, file: this.serializeFileWithDecryption(file, userKey) };
    } finally {
      await client.disconnect();
    }
  }

  async move(id: string, userId: string, dto: MoveFileDto) {
    const userKey = await this.getUserKey(userId);
    await this.findOneRaw(id, userId);
    const updated = await this.prisma.file.update({
      where: { id },
      data: { folderId: dto.folderId || null },
    });
    return this.serializeFileWithDecryption(updated, userKey);
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
    const userKey = await this.getUserKey(userId);
    await this.findOneRaw(id, userId);
    // Encrypt the new name before storing
    const encryptedName = this.encryptName(dto.name, userKey);
    const updated = await this.prisma.file.update({
      where: { id },
      data: { name: encryptedName },
    });
    return this.serializeFileWithDecryption(updated, userKey);
  }

  async remove(id: string, userId: string) {
    const userKey = await this.getUserKey(userId);
    await this.findOneRaw(id, userId);
    // Soft delete - move to trash
    const updated = await this.prisma.file.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return this.serializeFileWithDecryption(updated, userKey);
  }

  async batchDelete(userId: string, dto: BatchDeleteFilesDto) {
    const userKey = await this.getUserKey(userId);
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
    const userKey = await this.getUserKey(userId);
    const files = await this.prisma.file.findMany({
      where: { userId, deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    });
    return files.map(f => this.serializeFileWithDecryption(f, userKey));
  }

  async restore(id: string, userId: string) {
    const userKey = await this.getUserKey(userId);
    const file = await this.findOneRawIncludingTrashed(id, userId);
    if (!file.deletedAt) {
      throw new NotFoundException('File is not in trash');
    }
    const updated = await this.prisma.file.update({
      where: { id },
      data: { deletedAt: null },
    });
    return this.serializeFileWithDecryption(updated, userKey);
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
    const userKey = await this.getUserKey(userId);
    const files = await this.prisma.file.findMany({
      where: {
        userId,
        deletedAt: null,
      },
    });

    // Decrypt names and filter by query
    const lowerQuery = query.toLowerCase();
    return files
      .map(f => this.serializeFileWithDecryption(f, userKey))
      .filter(f => f.name.toLowerCase().includes(lowerQuery))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findFavorites(userId: string) {
    const userKey = await this.getUserKey(userId);
    const files = await this.prisma.file.findMany({
      where: { userId, isFavorite: true, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return files.map(f => this.serializeFileWithDecryption(f, userKey));
  }

  async toggleFavorite(id: string, userId: string) {
    const userKey = await this.getUserKey(userId);
    const file = await this.findOneRaw(id, userId);
    const updated = await this.prisma.file.update({
      where: { id },
      data: { isFavorite: !file.isFavorite },
    });
    return this.serializeFileWithDecryption(updated, userKey);
  }

  private serializeFile(file: PrismaFile): SerializedFile {
    return {
      ...file,
      size: file.size.toString(),
      messageId: file.messageId.toString(),
    };
  }

  private serializeFileWithDecryption(file: PrismaFile, userKey: Buffer): SerializedFile {
    return {
      ...file,
      name: this.decryptName(file.name, userKey),
      size: file.size.toString(),
      messageId: file.messageId.toString(),
    };
  }
}
