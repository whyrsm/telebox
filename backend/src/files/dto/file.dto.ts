import { IsString, IsNotEmpty, IsOptional, IsUUID, IsArray } from 'class-validator';

export class MoveFileDto {
  @IsUUID()
  @IsOptional()
  folderId?: string | null;
}

export class BatchMoveFilesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  fileIds: string[];

  @IsUUID()
  @IsOptional()
  folderId?: string | null;
}

export class RenameFileDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
