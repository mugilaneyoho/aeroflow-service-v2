import {
  Controller,
  Post,
  Body,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ChatService, AskDoubtDto } from '../../services/chat/chat.service';

export class IngestPdfDto {
  resourceId!: string;
  pdfUrl?: string;
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('health')
  getHealth(): { status: string; service: string; timestamp: string } {
    return {
      status: 'ok',
      service: 'aiputer',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Ingest PDF resource either via file upload or remote URL.
   */
  @Post('ingest-pdf')
  @UseInterceptors(FileInterceptor('file'))
  async ingestPdf(
    @Body() dto: IngestPdfDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ message: string; success: boolean; chunkCount: number }> {
    if (!dto.resourceId) {
      throw new BadRequestException('resourceId is required');
    }

    if (file) {
      const result = await this.chatService.ingestPdfBuffer(
        dto.resourceId,
        file.buffer,
      );
      return { message: 'PDF file processed successfully', ...result };
    } else if (dto.pdfUrl) {
      const result = await this.chatService.ingestPdfFromUrl(
        dto.resourceId,
        dto.pdfUrl,
      );
      return { message: 'PDF URL processed successfully', ...result };
    } else {
      throw new BadRequestException(
        'Either a file upload or pdfUrl is required',
      );
    }
  }

  /**
   * Non-streaming endpoint for student doubt questions.
   */
  @Post('ask')
  async askDoubt(
    @Body() dto: AskDoubtDto,
  ): Promise<{ answer: string; source: 'pdf' | 'general_ai' }> {
    if (!dto.question) {
      throw new BadRequestException('question field is required');
    }
    return await this.chatService.askDoubt(dto);
  }

  /**
   * Streaming SSE endpoint for real-time token output.
   */
  @Post('ask-stream')
  async askDoubtStream(
    @Body() dto: AskDoubtDto,
    @Res() res: Response,
  ): Promise<void> {
    if (!dto.question) {
      throw new BadRequestException('question field is required');
    }
    await this.chatService.askDoubtStream(dto, res);
  }
}
