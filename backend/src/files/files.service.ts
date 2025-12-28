import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { AuthService } from '../auth/auth.service';
import { MoveFileDto, RenameFileDto } from './dto/file.dto';

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
    private authService: AuthService,
  ) {}

  async findAll(userId: string, folderId?: string | null) {
    return this.prisma.file.findMany({
      where: {
        userId,
        folderId: folderId === undefined ? undefined : folderId,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
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

  async download(id: string, userId: string): Promise<{ buffer: Buffer; file: any }> {
    const file = await this.findOne(id, userId);
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
    await this.findOne(id, userId);
    const updated = await this.prisma.file.update({
      where: { id },
      data: { folderId: dto.folderId || null },
    });
    return this.serializeFile(updated);
  }

  async rename(id: string, userId: string, dto: RenameFileDto) {
    await this.findOne(id, userId);
    const updated = await this.prisma.file.update({
      where: { id },
      data: { name: dto.name },
    });
    return this.serializeFile(updated);
  }

  async remove(id: string, userId: string) {
    const file = await this.findOne(id, userId);
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

  private serializeFile(file: any) {
    return {
      ...file,
      size: file.size.toString(),
      messageId: file.messageId.toString(),
    };
  }
}
