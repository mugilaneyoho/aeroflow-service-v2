import * as Sentry from '@sentry/nestjs';
import axios from 'axios';
import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import cloudinary from '../config/cloudinary.config';
import { Note } from './entities/resource.entity';

export interface CloudinaryResult {
  public_id?: string;
  secure_url?: string;
  url?: string;
  format?: string;
}

@Injectable()
export class ResourcesService {
  private readonly logger = new Logger(ResourcesService.name);

  constructor(@InjectRepository(Note) private noteRepo: Repository<Note>) {}

  async getByIdNotes(id: number): Promise<Note> {
    const note = await this.noteRepo.findOne({ where: { id } });
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  async createNote(data: Record<string, unknown>): Promise<Note> {
    if (data.classDate === '') data.classDate = null;
    const note = this.noteRepo.create(data as DeepPartial<Note>);
    return await this.noteRepo.save(note);
  }

  async getNotes(): Promise<Note[]> {
    return await this.noteRepo.find();
  }

  async updateNote(
    id: number,
    dto: Record<string, unknown>,
  ): Promise<{ success: boolean; message: string; data: Note }> {
    try {
      this.logger.log(`Updating note with id=${id}`);
      if (dto.classDate === '') dto.classDate = null;
      const note = await this.noteRepo.findOne({ where: { id } });
      if (!note) {
        throw new NotFoundException('Note not found');
      }
      Object.assign(note, dto);
      const res = await this.noteRepo.save(note);

      return {
        success: true,
        message: 'Note updated successfully',
        data: res,
      };
    } catch (error: unknown) {
      Sentry.captureException(error);
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Error updating note', error);
      throw new InternalServerErrorException(message);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ key: string; url?: string; etag?: string }> {
    this.logger.log(`Uploading file: ${file?.originalname}`);

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File size is too large (limit is 20MB)');
    }

    if (!file.buffer) {
      throw new BadRequestException(
        'Multer should be configured with memoryStorage to provide file.buffer',
      );
    }

    const isImage = file.mimetype.startsWith('image/');

    try {
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

      const key =
        uploadResult.public_id || `${Date.now()}_${file.originalname}`;
      const url = uploadResult.secure_url || uploadResult.url || '';

      this.logger.log(`File uploaded successfully to Cloudinary: ${key}`);

      const isPdf =
        file.mimetype === 'application/pdf' ||
        file.originalname?.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        this.triggerAutoVectorIngestion(key, url, file).catch(
          (err: unknown) => {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.warn(`Auto vector ingestion failed: ${message}`);
          },
        );
      }

      return { key, url, etag: key };
    } catch (error: unknown) {
      Sentry.captureException(error);
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Error uploading file to Cloudinary', error);
      throw new InternalServerErrorException(
        message || 'Failed to upload file to Cloudinary',
      );
    }
  }

  private async triggerAutoVectorIngestion(
    resourceId: string,
    pdfUrl: string,
    file: Express.Multer.File,
  ): Promise<void> {
    const aiputerUrl =
      process.env.AIPUTER_SERVICE_URL || 'http://localhost:3025';
    this.logger.log(
      `Triggering automated PDF vector conversion for resource: ${resourceId}`,
    );

    try {
      if (pdfUrl || file.buffer) {
        await axios.post(`${aiputerUrl}/chat/ingest-pdf`, {
          resourceId,
          pdfUrl: pdfUrl || '',
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Auto PDF vector ingestion call warning: ${message}`);
    }
  }

  async listObjects(prefix?: string): Promise<unknown> {
    this.logger.log('Listing objects in Cloudinary');

    try {
      const options: Record<string, unknown> = {
        max_results: 100,
      };
      if (prefix) {
        options.prefix = prefix;
      }
      const result = await cloudinary.api.resources(options);
      this.logger.log('Objects listed successfully');
      return result;
    } catch (error: unknown) {
      Sentry.captureException(error);
      this.logger.error('Error listing objects in Cloudinary', error);
      throw new InternalServerErrorException(
        'Failed to list Cloudinary objects',
      );
    }
  }

  async downloadFile(key: string, _expiresSeconds = 60): Promise<string> {
    if (!key)
      throw new BadRequestException('Key is required to generate download URL');

    this.logger.log(`Generating download URL for key: ${key}`);

    try {
      const url = cloudinary.url(key, {
        secure: true,
        flags: 'attachment',
      });

      this.logger.log('Download URL generated');
      return url;
    } catch (error: unknown) {
      Sentry.captureException(error);
      this.logger.error('Error generating download URL', error);
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }
}
