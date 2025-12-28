import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { AuthService } from '../auth/auth.service';
import { MoveFileDto, RenameFileDto } from './dto/file.dto';

interface PrismaFile {
  id: string;
  name: string;
  size: bigint;
  mimeType: string;
  messageId: bigint;
  folderId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SerializedFile {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  messageId: string;
  folderId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
    private authService: AuthService,
  ) {}

  async findAll(userId: string, folderId?: string | null) {
    const files = await this.prisma.file.findMany({
      where: {
        userId,
        folderId: folderId === undefined ? undefined : folderId,
      },
      orderBy: { name: 'asc' },
    });
    return files.map(this.serializeFile);
  }

  async findOne(id: string, userId: string) {
    const file = await this.findOneRaw(id, userId);
    return this.serializeFile(file);
  }

  private async findOneRaw(id: string, userId: string) {
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
    const client = await this.authService.getClientForUser(userId);
    
    try {
      const message = await this.telegramService.uploadFile(
        client,
        file.buffer,
        file.originalname,
        file.mimetype,
      );

      const dbFile = await this.prisma.file.create({
        data: {
          name: file.originalname,
          size: BigInt(file.size),
          mimeType: file.mimetype,
          messageId: BigInt(message.id),
          folderId: folderId || null,
          userId,
        },
      });

      return this.serializeFile(dbFile);
    } finally {
      await client.disconnect();
    }
  }

  async download(id: string, userId: string): Promise<{ buffer: Buffer; file: SerializedFile }> {
    const file = await this.findOneRaw(id, userId);
    const client = await this.authService.getClientForUser(userId);
    
    try {
      const buffer = await this.telegramService.downloadFile(
        client,
        Number(file.messageId),
      );
      return { buffer, file: this.serializeFile(file) };
    } finally {
      await client.disconnect();
    }
  }

  async move(id: string, userId: string, dto: MoveFileDto) {
    await this.findOneRaw(id, userId);
    const updated = await this.prisma.file.update({
      where: { id },
      data: { folderId: dto.folderId || null },
    });
    return this.serializeFile(updated);
  }

  async rename(id: string, userId: string, dto: RenameFileDto) {
    await this.findOneRaw(id, userId);
    const updated = await this.prisma.file.update({
      where: { id },
      data: { name: dto.name },
    });
    return this.serializeFile(updated);
  }

  async remove(id: string, userId: string) {
    const file = await this.findOneRaw(id, userId);
    const client = await this.authService.getClientForUser(userId);
    
    try {
      await this.telegramService.deleteMessage(client, Number(file.messageId));
      await this.prisma.file.delete({ where: { id } });
      return { success: true };
    } finally {
      await client.disconnect();
    }
  }

  async search(userId: string, query: string) {
    const files = await this.prisma.file.findMany({
      where: {
        userId,
        name: { contains: query, mode: 'insensitive' },
      },
      orderBy: { name: 'asc' },
    });
    return files.map(this.serializeFile);
  }

  private serializeFile(file: PrismaFile): SerializedFile {
    return {
      ...file,
      size: file.size.toString(),
      messageId: file.messageId.toString(),
    };
  }
}
