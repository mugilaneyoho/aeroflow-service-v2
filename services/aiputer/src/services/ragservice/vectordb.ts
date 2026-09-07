import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PdfChunk } from './pdf-parser.service';

export interface SearchResult {
  chunk: PdfChunk;
  score: number;
}

@Injectable()
export class VectorDBStore implements OnModuleInit {
  private readonly logger = new Logger(VectorDBStore.name);
  private readonly store: Map<string, PdfChunk[]> = new Map();
  private readonly dbFilePath = path.join(
    process.cwd(),
    'data',
    'vector_store.json',
  );

  onModuleInit(): void {
    this.loadFromDisk();
  }

  /**
   * Store chunks for a specific resource ID and persist to disk.
   */
  addChunks(resourceId: string, chunks: PdfChunk[]): void {
    this.store.set(resourceId, chunks);
    this.logger.log(
      `Indexed ${chunks.length} chunks for resourceId: ${resourceId}`,
    );
    this.saveToDisk();
  }

  /**
   * Retrieve chunks for a specific resource ID or all resources.
   */
  getChunks(resourceId?: string): PdfChunk[] {
    if (resourceId && this.store.has(resourceId)) {
      return this.store.get(resourceId) || [];
    }
    const allChunks: PdfChunk[] = [];
    for (const chunks of this.store.values()) {
      allChunks.push(...chunks);
    }
    return allChunks;
  }

  /**
   * TF-IDF / term frequency matching to rank chunks relevant to a query.
   */
  search(query: string, resourceId?: string, topK = 4): SearchResult[] {
    const chunks = this.getChunks(resourceId);
    if (!chunks.length) return [];

    const queryTokens = this.tokenize(query);
    if (!queryTokens.length) return [];

    const scored: SearchResult[] = [];

    for (const chunk of chunks) {
      const chunkTextLower = chunk.text.toLowerCase();
      let matchCount = 0;
      let exactPhraseMatch = 0;

      if (chunkTextLower.includes(query.toLowerCase())) {
        exactPhraseMatch = 2;
      }

      for (const token of queryTokens) {
        if (chunkTextLower.includes(token)) {
          matchCount++;
        }
      }

      const score = matchCount / queryTokens.length + exactPhraseMatch;
      if (score > 0) {
        scored.push({ chunk, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  /**
   * Clear index for resource or all.
   */
  clear(resourceId?: string): void {
    if (resourceId) {
      this.store.delete(resourceId);
    } else {
      this.store.clear();
    }
    this.saveToDisk();
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 2);
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf8');
        const obj = JSON.parse(raw) as Record<string, PdfChunk[]>;
        for (const [key, value] of Object.entries(obj)) {
          if (Array.isArray(value)) {
            this.store.set(key, value);
          }
        }
        this.logger.log(
          `Loaded vector store from disk (${this.store.size} resources).`,
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed loading vector store from disk: ${message}`);
    }
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const obj: Record<string, PdfChunk[]> = {};
      for (const [key, value] of this.store.entries()) {
        obj[key] = value;
      }
      fs.writeFileSync(this.dbFilePath, JSON.stringify(obj, null, 2), 'utf8');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed saving vector store to disk: ${message}`);
    }
  }
}
