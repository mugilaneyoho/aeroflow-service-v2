import { Injectable } from '@nestjs/common';
import cloudinary from 'src/config/cloudinary.config';

@Injectable()
export class FileuploadService {
  async uploadFile(file: Express.Multer.File): Promise<any> {
    const isPdf = file.mimetype === 'application/pdf';
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'nestjs_uploads',
            resource_type: isPdf ? 'raw' : 'image', // 👈 key part
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        )
        .end(file.buffer);
    });
  }
}
