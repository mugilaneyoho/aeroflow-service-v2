import { Module } from '@nestjs/common';
import { FileuploadController } from './fileupload.controller';
import { FileuploadService } from './fileupload.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [FileuploadController],
  providers: [FileuploadService],
})
export class FileuploadModule {}
