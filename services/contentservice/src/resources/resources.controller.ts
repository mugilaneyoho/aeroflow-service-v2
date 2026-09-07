import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  Logger,
} from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CreateNoteDto } from './dto/create-resource.dto';
import { Note } from './entities/resource.entity';

@Controller('notes')
export class ResourcesController {
  private readonly logger = new Logger(ResourcesController.name);
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  async createNote(@Body() dto: CreateNoteDto): Promise<Note> {
    return await this.resourcesService.createNote(
      dto as unknown as Record<string, unknown>,
    );
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ key: string; url?: string; etag?: string }> {
    this.logger.log(`Received file: ${file?.originalname}`);
    return await this.resourcesService.uploadFile(file);
  }

  @Get()
  async getNotes(): Promise<Note[]> {
    return await this.resourcesService.getNotes();
  }

  @Get('/:id')
  async getNoteById(@Param('id') id: string): Promise<Note> {
    return await this.resourcesService.getByIdNotes(Number(id));
  }

  @Get('list')
  async listObjects(@Query('prefix') prefix?: string): Promise<unknown> {
    this.logger.log('Listing content of bucket');
    const responseData = await this.resourcesService.listObjects(prefix);
    this.logger.log(`Response Data: ${JSON.stringify(responseData)}`);
    return responseData;
  }

  @Get('download')
  async downloadFile(@Query('key') key: string): Promise<string> {
    this.logger.log(`Downloading file from bucket, key=${key}`);
    const responseData = await this.resourcesService.downloadFile(key);
    this.logger.log(`Response Data ${responseData}`);
    return responseData;
  }
}
