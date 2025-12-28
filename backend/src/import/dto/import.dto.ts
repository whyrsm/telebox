import { IsString, IsArray, IsNotEmpty, IsIn, IsNumber } from 'class-validator';

export class ImportFilesDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  @IsNotEmpty()
  chatName: string;

  @IsString()
  @IsIn(['user', 'group', 'channel', 'saved'])
  chatType: 'user' | 'group' | 'channel' | 'saved';

  @IsArray()
  @IsNotEmpty()
  messageIds: number[];
}

export class ImportSingleFileDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  @IsNotEmpty()
  chatName: string;

  @IsString()
  @IsIn(['user', 'group', 'channel', 'saved'])
  chatType: 'user' | 'group' | 'channel' | 'saved';

  @IsNumber()
  @IsNotEmpty()
  messageId: number;
}
