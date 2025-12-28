import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MoveFileDto, BatchMoveFilesDto, RenameFileDto } from './dto/file.dto';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Get()
  findAll(
    @CurrentUser() user: { sub: string },
    @Query('folderId') folderId?: string,
  ) {
    return this.filesService.findAll(user.sub, folderId || null);
  }

  @Get('search')
  search(
    @CurrentUser() user: { sub: string },
    @Query('q') query: string,
  ) {
    return this.filesService.search(user.sub, query || '');
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.filesService.findOne(id, user.sub);
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
    @Res() res: Response,
  ) {
    const { buffer, file } = await this.filesService.download(id, user.sub);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.name)}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('folderId') folderId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.filesService.upload(user.sub, file, folderId);
  }

  @Patch('batch/move')
  batchMove(
    @Body() dto: BatchMoveFilesDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.filesService.batchMove(user.sub, dto);
  }

  @Patch(':id/move')
  move(
    @Param('id') id: string,
    @Body() dto: MoveFileDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.filesService.move(id, user.sub, dto);
  }

  @Patch(':id/rename')
  rename(
    @Param('id') id: string,
    @Body() dto: RenameFileDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.filesService.rename(id, user.sub, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.filesService.remove(id, user.sub);
  }
}
