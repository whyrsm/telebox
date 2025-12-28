import { IsString, IsNotEmpty } from 'class-validator';

export class SendCodeDto {
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class VerifyCodeDto {
  @IsString()
  @IsNotEmpty()
  tempToken: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
