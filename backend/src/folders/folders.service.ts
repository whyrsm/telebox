import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto, UpdateFolderDto, MoveFolderDto, BatchMoveFoldersDto } from './dto/folder.dto';
import { Folder as PrismaFolder } from '@prisma/client';

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
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id, userId, deletedAt: null },
      include: { children: true, files: true },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    return folder;
  }

  private async findOneIncludingTrashed(id: string, userId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id, userId },
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
    // Soft delete - move to trash (also soft delete all files in folder)
    await this.prisma.$transaction([
      this.prisma.file.updateMany({
        where: { folderId: id, userId },
        data: { deletedAt: new Date() },
      }),
      this.prisma.folder.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    ]);
    return { success: true };
  }

  async getFolderTree(userId: string): Promise<FolderWithChildren[]> {
    const folders = await this.prisma.folder.findMany({
      where: { userId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
    return this.buildTree(folders);
  }

  async findFavorites(userId: string) {
    return this.prisma.folder.findMany({
      where: { userId, isFavorite: true, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  // Trash methods
  async findTrashed(userId: string) {
    return this.prisma.folder.findMany({
      where: { userId, deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    });
  }

  async restore(id: string, userId: string) {
    const folder = await this.findOneIncludingTrashed(id, userId);
    if (!folder.deletedAt) {
      throw new NotFoundException('Folder is not in trash');
    }
    // Restore folder and its files
    await this.prisma.$transaction([
      this.prisma.file.updateMany({
        where: { folderId: id, userId, deletedAt: { not: null } },
        data: { deletedAt: null },
      }),
      this.prisma.folder.update({
        where: { id },
        data: { deletedAt: null },
      }),
    ]);
    return { success: true };
  }

  async permanentDelete(id: string, userId: string) {
    const folder = await this.findOneIncludingTrashed(id, userId);
    if (!folder.deletedAt) {
      throw new NotFoundException('Folder must be in trash before permanent deletion');
    }
    // Cascade delete will handle files
    await this.prisma.folder.delete({ where: { id } });
    return { success: true };
  }

  async toggleFavorite(id: string, userId: string) {
    const folder = await this.findOne(id, userId);
    return this.prisma.folder.update({
      where: { id },
      data: { isFavorite: !folder.isFavorite },
    });
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
