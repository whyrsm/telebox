import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ImportService } from './import.service';
import { ImportFilesDto, ImportSingleFileDto } from './dto/import.dto';

@Controller('import')
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Get('dialogs')
  async getDialogs(@CurrentUser() user: { sub: string }) {
    try {
      return this.importService.getDialogs(user.sub);
    } catch (error) {
      console.error('Error fetching dialogs:', error);
      throw error;
    }
  }

  @Get('dialogs/files')
  async getDialogFiles(
    @CurrentUser() user: { sub: string },
    @Query('chatId') chatId: string,
    @Query('chatType') chatType: string,
    @Query('limit') limit?: string,
  ) {
    return this.importService.getDialogFiles(
      user.sub,
      chatId,
      chatType as 'user' | 'group' | 'channel' | 'saved',
      limit ? parseInt(limit) : 100,
    );
  }

  @Post()
  async importFiles(
    @CurrentUser() user: { sub: string },
    @Body() dto: ImportFilesDto,
  ) {
    return this.importService.importFiles(user.sub, dto);
  }

  @Post('single')
  async importSingleFile(
    @CurrentUser() user: { sub: string },
    @Body() dto: ImportSingleFileDto,
  ) {
    return this.importService.importSingleFile(user.sub, dto);
  }
}
