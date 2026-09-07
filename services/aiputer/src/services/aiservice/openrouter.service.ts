import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { Response } from 'express';
import { Readable } from 'stream';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface OpenRouterStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
}

interface ApiErrorResponse {
  error?: {
    message?: string;
  };
}

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  private getApiKey(): string {
    return process.env.OPENROUTER_API_KEY || '';
  }

  private getModel(): string {
    return process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
  }

  /**
   * Non-streaming chat completion call to OpenRouter.
   */
  async chatCompletion(
    messages: ChatMessage[],
    modelOverride?: string,
  ): Promise<string> {
    const apiKey = this.getApiKey();
    const model = modelOverride || this.getModel();

    if (!apiKey) {
      this.logger.warn(
        'OPENROUTER_API_KEY is not configured in environment variables.',
      );
    }

    try {
      const response = await axios.post<OpenRouterResponse>(
        this.apiUrl,
        {
          model,
          messages,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://aeroflow.service',
            'X-Title': 'AeroFlow AIPuter Chatbot',
            'Content-Type': 'application/json',
          },
        },
      );

      return (
        response.data?.choices?.[0]?.message?.content ||
        'No response content returned.'
      );
    } catch (error: unknown) {
      const err = error as AxiosError<ApiErrorResponse>;
      const message =
        err.response?.data?.error?.message || err.message || 'Unknown error';
      this.logger.error(`OpenRouter API error: ${message}`);
      throw new Error(`OpenRouter completion failed: ${message}`);
    }
  }

  /**
   * Streaming chat completion call sending SSE tokens directly to Express response.
   */
  async streamChatCompletion(
    messages: ChatMessage[],
    res: Response,
    modelOverride?: string,
  ): Promise<void> {
    const apiKey = this.getApiKey();
    const model = modelOverride || this.getModel();

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    if (!apiKey) {
      res.write(
        `data: ${JSON.stringify({ error: 'OPENROUTER_API_KEY missing in server config' })}\n\n`,
      );
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    try {
      const response = await axios.post<Readable>(
        this.apiUrl,
        {
          model,
          messages,
          stream: true,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://aeroflow.service',
            'X-Title': 'AeroFlow AIPuter Chatbot',
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
        },
      );

      const stream = response.data;

      stream.on('data', (chunk: Buffer) => {
        const lines = chunk.toString('utf8').split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.replace(/^data:\s*/, '');
            if (dataStr === '[DONE]') {
              res.write('data: [DONE]\n\n');
              continue;
            }
            try {
              const parsed = JSON.parse(dataStr) as OpenRouterStreamChunk;
              const deltaContent = parsed.choices?.[0]?.delta?.content;
              if (deltaContent) {
                res.write(
                  `data: ${JSON.stringify({ token: deltaContent })}\n\n`,
                );
              }
            } catch {
              // Ignore non-JSON lines or partial buffers
            }
          }
        }
      });

      stream.on('end', () => {
        res.write('data: [DONE]\n\n');
        res.end();
      });

      stream.on('error', (streamErr: Error) => {
        this.logger.error(`Stream error: ${streamErr.message}`);
        res.write(`data: ${JSON.stringify({ error: streamErr.message })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      });
    } catch (error: unknown) {
      const err = error as AxiosError<ApiErrorResponse>;
      const message =
        err.response?.data?.error?.message ||
        err.message ||
        'Stream connection failed';
      this.logger.error(`OpenRouter Stream API request failed: ${message}`);
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
}
