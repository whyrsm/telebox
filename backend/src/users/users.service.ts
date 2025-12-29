import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByTelegramId(telegramId: bigint) {
    return this.prisma.user.findUnique({ where: { telegramId } });
  }

  async getStorageStats(userId: string) {
    const result = await this.prisma.file.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: { size: true },
    });

    return {
      fileCount: result._count.id,
      totalSize: result._sum.size || BigInt(0),
    };
  }
}
