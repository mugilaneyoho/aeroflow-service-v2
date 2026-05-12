import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileuploadService } from './fileupload.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('fileupload')
export class FileuploadController {
  constructor(private cloudnaryService: FileuploadService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 1 * 1024 * 1024 },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only images and PDFs are allowed');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const files = await this.cloudnaryService.uploadFile(file);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const path = `staticfiles/${files.public_id}.${files.format}`;

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      file: files.secure_url,
      path,
    };
  }
}
