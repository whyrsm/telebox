import { IsString, IsArray, IsNotEmpty } from 'class-validator';

export class ImportFilesDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  @IsNotEmpty()
  chatName: string;

  @IsArray()
  @IsNotEmpty()
  messageIds: number[];
}
