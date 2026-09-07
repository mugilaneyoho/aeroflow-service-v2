import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import cloudinary from '../config/cloudinary.config';

export interface CloudinaryResult {
  public_id?: string;
  secure_url?: string;
  url?: string;
  format?: string;
}

@Injectable()
export class FileuploadService {
  private readonly logger = new Logger(FileuploadService.name);

  async uploadFile(file: Express.Multer.File): Promise<CloudinaryResult> {
    const isImage = file.mimetype.startsWith('image/');
    const uploadResult = await new Promise<CloudinaryResult>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: 'nestjs_uploads',
              resource_type: isImage ? 'image' : 'raw',
            },
            (error, result) => {
              if (error) {
                const errMsg =
                  typeof error === 'object' &&
                  error !== null &&
                  'message' in error
                    ? String((error as { message: unknown }).message)
                    : 'Cloudinary upload failed';
                return reject(new Error(errMsg));
              }
              resolve((result as CloudinaryResult) || {});
            },
          )
          .end(file.buffer);
      },
    );

    // Automated trigger: If uploaded resource is a PDF, auto convert to vector data in AIPuter
    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalname?.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      this.triggerAutoVectorIngestion(uploadResult, file).catch(
        (err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          this.logger.warn(`Auto vector ingestion failed: ${message}`);
        },
      );
    }

    return uploadResult;
  }

  private async triggerAutoVectorIngestion(
    uploadResult: CloudinaryResult,
    file: Express.Multer.File,
  ): Promise<void> {
    const aiputerUrl =
      process.env.AIPUTER_SERVICE_URL || 'http://localhost:3025';
    const resourceId =
      uploadResult.public_id || file.originalname || `pdf_${Date.now()}`;
    const pdfUrl = uploadResult.secure_url || uploadResult.url || '';

    this.logger.log(
      `Triggering automated PDF vector conversion for resource: ${resourceId}`,
    );

    try {
      if (pdfUrl) {
        await axios.post(`${aiputerUrl}/chat/ingest-pdf`, {
          resourceId,
          pdfUrl,
        });
        this.logger.log(
          `Automated PDF vector data generated and stored for ${resourceId}`,
        );
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Auto PDF vector ingestion call warning: ${message}`);
    }
  }
}
