import * as Sentry from '@sentry/nestjs';
import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Note } from './entities/resource.entity';

@Injectable()
export class ResourcesService {
  private readonly logger = new Logger(ResourcesService.name);
  private readonly AWS_S3_BUCKET = process.env.AWS_S3_BUCKET_NAME;
  private readonly AWS_REGION = process.env.AWS_REGION || 'us-east-1';
  private readonly s3: S3Client;

  constructor(@InjectRepository(Note) private noteRepo: Repository<Note>) {
    if (!this.AWS_S3_BUCKET) {
      this.logger.warn('AWS_S3_BUCKET_NAME is not set in environment');
    }

    this.s3 = new S3Client({
      region: this.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async getByIdNotes(id: number) {
    const note = await this.noteRepo.findOne({ where: { id } });
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  async createNote(data: any) {
    if (data.classDate === '') data.classDate = null;
    const note = this.noteRepo.create(data);
    return await this.noteRepo.save(note);
  }

  async getNotes(): Promise<Note[]> {
    return await this.noteRepo.find();
  }

  async updateNote(id: number, dto: any) {
    try {
      console.log(`Updating note with id=${id}`);
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
    } catch (error: any) {
      Sentry.captureException(error);
      this.logger.error('Error updating note', error);

      throw new InternalServerErrorException(error?.message);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ key: string; url?: string; etag?: string }> {
    this.logger.log(`Uploading file: ${file?.originalname}`);

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const MAX_SIZE = 1 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File size is too large (limit is 5MB)');
    }

    if (!file.buffer) {
      throw new BadRequestException(
        'Multer should be configured with memoryStorage to provide file.buffer',
      );
    }

    if (!this.AWS_S3_BUCKET) {
      throw new BadRequestException('AWS_S3_BUCKET_NAME is not configured');
    }

    const key = `${Date.now()}_${file.originalname}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.AWS_S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentDisposition: 'inline',
      });

      const result = await this.s3.send(command);

      this.logger.log(`File uploaded successfully: ${key}`);

      const url = `https://${this.AWS_S3_BUCKET}.s3.${this.AWS_REGION}.amazonaws.com/${encodeURIComponent(key)}`;

      return { key, url, etag: (result as any).ETag };
    } catch (error) {
      Sentry.captureException(error);
      this.logger.error('Error uploading file to S3', error);
      throw new InternalServerErrorException('Failed to upload file to S3');
    }
  }

  private buildListParams(prefix?: string) {
    if (!this.AWS_S3_BUCKET) {
      throw new BadRequestException('AWS_S3_BUCKET_NAME is not configured');
    }
    return {
      Bucket: this.AWS_S3_BUCKET,
      Prefix: prefix,
      Delimiter: '/',
    };
  }

  async listObjects(prefix?: string): Promise<any> {
    this.logger.log('Listing objects in S3 bucket');

    try {
      const params = this.buildListParams(prefix);
      const command = new ListObjectsV2Command(params as any);
      const result = await this.s3.send(command);
      this.logger.log('Objects listed successfully');
      return result;
    } catch (error) {
      Sentry.captureException(error);
      this.logger.error('Error listing objects in S3', error);
      throw new InternalServerErrorException('Failed to list S3 objects');
    }
  }

  async downloadFile(key: string, expiresSeconds = 60): Promise<string> {
    if (!key)
      throw new BadRequestException('Key is required to generate download URL');

    if (!this.AWS_S3_BUCKET) {
      throw new BadRequestException('AWS_S3_BUCKET_NAME is not configured');
    }

    this.logger.log(`Generating signed URL for key: ${key}`);

    try {
      const command = new GetObjectCommand({
        Bucket: this.AWS_S3_BUCKET,
        Key: key,
      });

      const url = await getSignedUrl(this.s3, command, {
        expiresIn: expiresSeconds,
      });

      this.logger.log('Signed URL generated');
      return url;
    } catch (error) {
      Sentry.captureException(error);
      this.logger.error('Error generating signed URL', error);
      throw new InternalServerErrorException('Failed to generate signed URL');
    }
  }
}
