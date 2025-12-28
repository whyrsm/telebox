import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { TelegramModule } from '../telegram/telegram.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TelegramModule, AuthModule],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
