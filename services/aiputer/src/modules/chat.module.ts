import { Module } from '@nestjs/common';
import { ChatController } from '../controllers/chat/chat.controller';
import { ChatService } from '../services/chat/chat.service';
import { OpenRouterService } from '../services/aiservice/openrouter.service';
import { PdfParserService } from '../services/ragservice/pdf-parser.service';
import { VectorDBStore } from '../services/ragservice/vectordb';

@Module({
  controllers: [ChatController],
  providers: [ChatService, OpenRouterService, PdfParserService, VectorDBStore],
  exports: [ChatService, OpenRouterService, VectorDBStore],
})
export class ChatModule {}
