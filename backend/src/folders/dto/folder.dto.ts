import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

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
