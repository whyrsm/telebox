import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class MoveFileDto {
  @IsUUID()
  @IsOptional()
  folderId?: string | null;
}

export class RenameFileDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
