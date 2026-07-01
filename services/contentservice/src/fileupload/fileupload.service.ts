import { Injectable } from '@nestjs/common';
import cloudinary from 'src/config/cloudinary.config';

@Injectable()
export class FileuploadService {
  async uploadFile(file: Express.Multer.File): Promise<any> {
    const isImage = file.mimetype.startsWith('image/');
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'nestjs_uploads',
            resource_type: isImage ? 'image' : 'raw',
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
