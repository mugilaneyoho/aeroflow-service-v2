import {
  Controller,
  Get,
  Post,
  // Put,
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

@Controller('notes')
export class ResourcesController {
  private readonly logger = new Logger(ResourcesController.name);
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  async createNote(@Body() dto: CreateNoteDto) {
    return await this.resourcesService.createNote(dto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<any> {
    this.logger.log(`Received file: ${file?.originalname}`);
    return await this.resourcesService.uploadFile(file);
  }

  @Get()
  async getNotes() {
    return await this.resourcesService.getNotes();
  }

  @Get('/:id')
  async getNoteById(@Param('id') id: string) {
    return await this.resourcesService.getByIdNotes(Number(id));
  }

  @Get('list')
  async listObjects(@Query('prefix') prefix?: string): Promise<any> {
    this.logger.log('Listing content of bucket');
    const responseData = await this.resourcesService.listObjects(prefix);
    this.logger.log('Response Data: ' + JSON.stringify(responseData));
    return responseData;
  }

  @Get('download')
  async downloadFile(@Query('key') key: string): Promise<any> {
    this.logger.log(`Downloading file from bucket, key=${key}`);
    const responseData = await this.resourcesService.downloadFile(key);
    this.logger.log('Response Data ' + responseData);
    return responseData;
  }
}
