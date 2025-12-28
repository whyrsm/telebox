import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto, UpdateFolderDto, MoveFolderDto } from './dto/folder.dto';

export interface PrismaFolder {
  id: string;
  name: string;
  parentId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FolderWithChildren extends PrismaFolder {
  children?: FolderWithChildren[];
}

@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, parentId?: string | null) {
    return this.prisma.folder.findMany({
      where: {
        userId,
        parentId: parentId === undefined ? undefined : parentId,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id, userId },
      include: { children: true, files: true },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    return folder;
  }

  async create(userId: string, dto: CreateFolderDto) {
    return this.prisma.folder.create({
      data: {
        name: dto.name,
        parentId: dto.parentId || null,
        userId,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateFolderDto) {
    await this.findOne(id, userId);
    return this.prisma.folder.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async move(id: string, userId: string, dto: MoveFolderDto) {
    await this.findOne(id, userId);
    if (dto.parentId) {
      await this.findOne(dto.parentId, userId);
    }
    return this.prisma.folder.update({
      where: { id },
      data: { parentId: dto.parentId || null },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.folder.delete({ where: { id } });
  }

  async getFolderTree(userId: string): Promise<FolderWithChildren[]> {
    const folders = await this.prisma.folder.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
    return this.buildTree(folders);
  }

  private buildTree(
    folders: PrismaFolder[],
    parentId: string | null = null,
  ): FolderWithChildren[] {
    return folders
      .filter((f) => f.parentId === parentId)
      .map((f) => ({
        ...f,
        children: this.buildTree(folders, f.id),
      }));
  }
}
