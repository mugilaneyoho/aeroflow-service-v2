import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import {
  OpenRouterService,
  ChatMessage,
} from '../aiservice/openrouter.service';
import { PdfParserService } from '../ragservice/pdf-parser.service';
import { VectorDBStore } from '../ragservice/vectordb';

export class AskDoubtDto {
  question!: string;
  resourceId?: string;
  pdfUrl?: string;
  model?: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly openRouterService: OpenRouterService,
    private readonly pdfParserService: PdfParserService,
    private readonly vectorDBStore: VectorDBStore,
  ) {}

  /**
   * Ingest PDF from uploaded file buffer.
   */
  async ingestPdfBuffer(
    resourceId: string,
    buffer: Buffer,
  ): Promise<{ success: boolean; chunkCount: number }> {
    const text = await this.pdfParserService.extractTextFromBuffer(buffer);
    const chunks = this.pdfParserService.chunkText(text, resourceId);
    this.vectorDBStore.addChunks(resourceId, chunks);
    return { success: true, chunkCount: chunks.length };
  }

  /**
   * Ingest PDF from public URL (e.g., Cloudinary resource URL).
   */
  async ingestPdfFromUrl(
    resourceId: string,
    pdfUrl: string,
  ): Promise<{ success: boolean; chunkCount: number }> {
    const text = await this.pdfParserService.extractTextFromUrl(pdfUrl);
    const chunks = this.pdfParserService.chunkText(text, resourceId);
    this.vectorDBStore.addChunks(resourceId, chunks);
    return { success: true, chunkCount: chunks.length };
  }

  /**
   * Solve student doubt with non-streaming completion.
   */
  async askDoubt(
    dto: AskDoubtDto,
  ): Promise<{ answer: string; source: 'pdf' | 'general_ai' }> {
    const { messages, source } = await this.preparePromptMessages(dto);
    const answer = await this.openRouterService.chatCompletion(
      messages,
      dto.model,
    );
    return { answer, source };
  }

  /**
   * Solve student doubt with streaming SSE response.
   */
  async askDoubtStream(dto: AskDoubtDto, res: Response): Promise<void> {
    const { messages } = await this.preparePromptMessages(dto);
    await this.openRouterService.streamChatCompletion(messages, res, dto.model);
  }

  /**
   * Prepare LLM prompt messages based on available PDF context vs General AI fallback.
   */
  private async preparePromptMessages(
    dto: AskDoubtDto,
  ): Promise<{ messages: ChatMessage[]; source: 'pdf' | 'general_ai' }> {
    // If a PDF URL was passed on the fly, auto-ingest it if not already present
    if (dto.pdfUrl && dto.resourceId) {
      const existing = this.vectorDBStore.getChunks(dto.resourceId);
      if (!existing.length) {
        try {
          await this.ingestPdfFromUrl(dto.resourceId, dto.pdfUrl);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          this.logger.warn(`Failed auto-ingesting PDF URL: ${message}`);
        }
      }
    }

    const searchResults = this.vectorDBStore.search(
      dto.question,
      dto.resourceId,
    );
    const hasPdfContext = searchResults.length > 0;

    let systemPrompt = '';
    let source: 'pdf' | 'general_ai' = 'general_ai';

    if (hasPdfContext) {
      source = 'pdf';
      const contextText = searchResults
        .map((res, i) => `[Passage ${i + 1}]: ${res.chunk.text}`)
        .join('\n\n');
      systemPrompt = `You are a helpful educational assistant for students.
Answer the student's doubt using the provided uploaded PDF study material context below.
Be concise, clear, and direct.

Uploaded PDF Context:
${contextText}`;
    } else {
      source = 'general_ai';
      systemPrompt = `You are a helpful educational assistant for students.
The student asked a question, but no relevant content was found in their uploaded PDF study materials.
Please provide a clear and helpful general AI answer/suggestion to their question.
Start your response with: "[Note: No relevant info found in uploaded PDF materials. Providing general AI suggestion:]"`;
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: dto.question },
    ];

    return { messages, source };
  }
}
