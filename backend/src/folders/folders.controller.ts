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
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateFolderDto, UpdateFolderDto, MoveFolderDto } from './dto/folder.dto';

@Controller('folders')
@UseGuards(JwtAuthGuard)
export class FoldersController {
  constructor(private foldersService: FoldersService) {}

  @Get()
  findAll(
    @CurrentUser() user: { sub: string },
    @Query('parentId') parentId?: string,
  ) {
    return this.foldersService.findAll(user.sub, parentId || null);
  }

  @Get('tree')
  getTree(@CurrentUser() user: { sub: string }) {
    return this.foldersService.getFolderTree(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.foldersService.findOne(id, user.sub);
  }

  @Post()
  create(@Body() dto: CreateFolderDto, @CurrentUser() user: { sub: string }) {
    return this.foldersService.create(user.sub, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFolderDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.foldersService.update(id, user.sub, dto);
  }

  @Patch(':id/move')
  move(
    @Param('id') id: string,
    @Body() dto: MoveFolderDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.foldersService.move(id, user.sub, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.foldersService.remove(id, user.sub);
  }
}
