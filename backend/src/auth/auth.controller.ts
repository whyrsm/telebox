import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SendCodeDto, VerifyCodeDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('send-code')
  async sendCode(@Body() dto: SendCodeDto) {
    return this.authService.sendCode(dto.phone);
  }

  @Post('verify')
  async verify(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyCode(dto.tempToken, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: any) {
    const user = await this.authService.validateUser(req.user.sub);
    return {
      id: user.id,
      telegramId: user.telegramId.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
    };
  }
}
