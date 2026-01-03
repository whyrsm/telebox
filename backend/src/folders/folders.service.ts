import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../common/services/crypto.service';
import { CreateFolderDto, UpdateFolderDto, MoveFolderDto, BatchMoveFoldersDto, BatchDeleteFoldersDto } from './dto/folder.dto';
import { Folder as PrismaFolder } from '@prisma/client';

export interface SerializedFolder {
  id: string;
  name: string;
  parentId: string | null;
  userId: string;
  isFavorite: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FolderWithChildren extends SerializedFolder {
  children?: FolderWithChildren[];
}

@Injectable()
export class FoldersService {
  constructor(
    private prisma: PrismaService,
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

  private serializeFolder(folder: PrismaFolder, userKey: Buffer): SerializedFolder {
    return {
      ...folder,
      name: this.decryptName(folder.name, userKey),
    };
  }

  async findAll(userId: string, parentId?: string | null) {
    const userKey = await this.getUserKey(userId);
    const folders = await this.prisma.folder.findMany({
      where: {
        userId,
        parentId: parentId === undefined ? undefined : parentId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    return folders.map(f => this.serializeFolder(f, userKey));
  }

  async findOne(id: string, userId: string) {
    const userKey = await this.getUserKey(userId);
    const folder = await this.prisma.folder.findFirst({
      where: { id, userId, deletedAt: null },
      include: { children: true, files: true },
    });
    if (!folder) throw new NotFoundException('Folder not found');

    return {
      ...this.serializeFolder(folder, userKey),
      children: folder.children.map(c => this.serializeFolder(c, userKey)),
      files: folder.files,
    };
  }

  async findOneWithPath(id: string, userId: string) {
    const userKey = await this.getUserKey(userId);
    const folder = await this.prisma.folder.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!folder) throw new NotFoundException('Folder not found');

    // Build the path from root to this folder
    const path: SerializedFolder[] = [];
    let currentFolder = folder;

    while (currentFolder) {
      path.unshift(this.serializeFolder(currentFolder, userKey));
      if (currentFolder.parentId) {
        const parent = await this.prisma.folder.findFirst({
          where: { id: currentFolder.parentId, userId, deletedAt: null },
        });
        if (parent) {
          currentFolder = parent;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return { folder: this.serializeFolder(folder, userKey), path };
  }

  private async findOneIncludingTrashed(id: string, userId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id, userId },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    return folder;
  }

  private async findOneRaw(id: string, userId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    return folder;
  }

  async create(userId: string, dto: CreateFolderDto) {
    const userKey = await this.getUserKey(userId);
    const encryptedName = this.encryptName(dto.name, userKey);
    const folder = await this.prisma.folder.create({
      data: {
        name: encryptedName,
        parentId: dto.parentId || null,
        userId,
      },
    });
    return this.serializeFolder(folder, userKey);
  }

  async update(id: string, userId: string, dto: UpdateFolderDto) {
    const userKey = await this.getUserKey(userId);
    await this.findOneRaw(id, userId);
    const encryptedName = this.encryptName(dto.name, userKey);
    const folder = await this.prisma.folder.update({
      where: { id },
      data: { name: encryptedName },
    });
    return this.serializeFolder(folder, userKey);
  }

  async move(id: string, userId: string, dto: MoveFolderDto) {
    const userKey = await this.getUserKey(userId);
    await this.findOneRaw(id, userId);
    if (dto.parentId) {
      await this.findOneRaw(dto.parentId, userId);
    }
    const folder = await this.prisma.folder.update({
      where: { id },
      data: { parentId: dto.parentId || null },
    });
    return this.serializeFolder(folder, userKey);
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
      await this.findOneRaw(dto.parentId, userId);
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
    await this.findOneRaw(id, userId);
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

  async batchDelete(userId: string, dto: BatchDeleteFoldersDto) {
    // Verify all folders belong to user and are not already deleted
    const folders = await this.prisma.folder.findMany({
      where: { id: { in: dto.folderIds }, userId, deletedAt: null },
    });
    if (folders.length !== dto.folderIds.length) {
      throw new NotFoundException('One or more folders not found');
    }

    // Soft delete - move to trash (also soft delete all files in these folders)
    await this.prisma.$transaction([
      this.prisma.file.updateMany({
        where: { folderId: { in: dto.folderIds }, userId },
        data: { deletedAt: new Date() },
      }),
      this.prisma.folder.updateMany({
        where: { id: { in: dto.folderIds }, userId },
        data: { deletedAt: new Date() },
      }),
    ]);

    return { count: dto.folderIds.length };
  }

  async getFolderTree(userId: string): Promise<FolderWithChildren[]> {
    const userKey = await this.getUserKey(userId);
    const folders = await this.prisma.folder.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return this.buildTree(folders, userKey);
  }

  async findFavorites(userId: string) {
    const userKey = await this.getUserKey(userId);
    const folders = await this.prisma.folder.findMany({
      where: { userId, isFavorite: true, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return folders.map(f => this.serializeFolder(f, userKey));
  }

  // Trash methods
  async findTrashed(userId: string) {
    const userKey = await this.getUserKey(userId);
    const folders = await this.prisma.folder.findMany({
      where: { userId, deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    });
    return folders.map(f => this.serializeFolder(f, userKey));
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
    const userKey = await this.getUserKey(userId);
    const folder = await this.findOneRaw(id, userId);
    const updated = await this.prisma.folder.update({
      where: { id },
      data: { isFavorite: !folder.isFavorite },
    });
    return this.serializeFolder(updated, userKey);
  }

  private buildTree(
    folders: PrismaFolder[],
    userKey: Buffer,
    parentId: string | null = null,
  ): FolderWithChildren[] {
    return folders
      .filter((f) => f.parentId === parentId)
      .map((f) => ({
        ...this.serializeFolder(f, userKey),
        children: this.buildTree(folders, userKey, f.id),
      }));
  }
}
