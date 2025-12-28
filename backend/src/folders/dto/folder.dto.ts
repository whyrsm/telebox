import { IsString, IsNotEmpty, IsOptional, IsUUID, IsArray } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;
}

export class UpdateFolderDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class MoveFolderDto {
  @IsUUID()
  @IsOptional()
  parentId?: string | null;
}

export class BatchMoveFoldersDto {
  @IsArray()
  @IsUUID('4', { each: true })
  folderIds: string[];

  @IsUUID()
  @IsOptional()
  parentId?: string | null;
}
