import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (
  dataBuffer: Buffer,
) => Promise<{ text?: string }>;

export interface PdfChunk {
  id: string;
  resourceId: string;
  chunkIndex: number;
  text: string;
}

@Injectable()
export class PdfParserService {
  private readonly logger = new Logger(PdfParserService.name);

  /**
   * Extract text from a PDF file buffer.
   */
  async extractTextFromBuffer(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text || '';
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to parse PDF buffer: ${message}`);
      throw new Error(`PDF parsing failed: ${message}`);
    }
  }

  /**
   * Download PDF from a public URL (e.g. Cloudinary) and extract text.
   */
  async extractTextFromUrl(url: string): Promise<string> {
    try {
      const response = await axios.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
      });
      const buffer = Buffer.from(response.data);
      return await this.extractTextFromBuffer(buffer);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to download or parse PDF from URL ${url}: ${message}`,
      );
      throw new Error(`PDF URL extraction failed: ${message}`);
    }
  }

  /**
   * Chunk full text into logical passages for RAG indexing.
   */
  chunkText(
    text: string,
    resourceId: string,
    chunkSize = 600,
    overlap = 100,
  ): PdfChunk[] {
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    if (!cleanedText) return [];

    const chunks: PdfChunk[] = [];
    let start = 0;
    let index = 0;

    while (start < cleanedText.length) {
      const end = Math.min(start + chunkSize, cleanedText.length);
      const chunkText = cleanedText.slice(start, end).trim();

      if (chunkText.length > 0) {
        chunks.push({
          id: `${resourceId}_chunk_${index}`,
          resourceId,
          chunkIndex: index,
          text: chunkText,
        });
        index++;
      }

      if (end >= cleanedText.length) break;
      start += chunkSize - overlap;
    }

    return chunks;
  }
}
