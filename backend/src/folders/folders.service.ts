import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto, UpdateFolderDto, MoveFolderDto, BatchMoveFoldersDto } from './dto/folder.dto';

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

  async batchMove(userId: string, dto: BatchMoveFoldersDto) {
    // Verify all folders belong to user
    const folders = await this.prisma.folder.findMany({
      where: { id: { in: dto.folderIds }, userId },
    });
    if (folders.length !== dto.folderIds.length) {
      throw new NotFoundException('One or more folders not found');
    }

    // Verify target folder if specified
    if (dto.parentId) {
      await this.findOne(dto.parentId, userId);
      // Prevent moving folder into itself or its children
      if (dto.folderIds.includes(dto.parentId)) {
        throw new NotFoundException('Cannot move folder into itself');
      }
    }

    await this.prisma.folder.updateMany({
      where: { id: { in: dto.folderIds }, userId },
      data: { parentId: dto.parentId || null },
    });

    return { count: dto.folderIds.length };
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
