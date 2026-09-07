import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { OpenRouterService } from '../aiservice/openrouter.service';
import { PdfParserService } from '../ragservice/pdf-parser.service';
import { VectorDBStore } from '../ragservice/vectordb';

describe('ChatService', () => {
  let service: ChatService;
  let vectorStore: VectorDBStore;
  let openRouterService: OpenRouterService;

  beforeEach(async () => {
    const mockOpenRouterService = {
      chatCompletion: jest
        .fn()
        .mockResolvedValue('Mocked answer based on context'),
      streamChatCompletion: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        PdfParserService,
        VectorDBStore,
        {
          provide: OpenRouterService,
          useValue: mockOpenRouterService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    vectorStore = module.get<VectorDBStore>(VectorDBStore);
    openRouterService = module.get<OpenRouterService>(OpenRouterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should use PDF context when relevant text exists in stored PDF', async () => {
    vectorStore.addChunks('res-1', [
      {
        id: 'res-1_chunk_0',
        resourceId: 'res-1',
        chunkIndex: 0,
        text: 'Photosynthesis is the process by which green plants convert light into chemical energy.',
      },
    ]);

    const spy = jest.spyOn(openRouterService, 'chatCompletion');

    const result = await service.askDoubt({
      question: 'What is photosynthesis?',
      resourceId: 'res-1',
    });

    expect(result.source).toBe('pdf');
    expect(spy).toHaveBeenCalled();
  });

  it('should fallback to general_ai when no relevant content exists in PDF', async () => {
    const spy = jest.spyOn(openRouterService, 'chatCompletion');

    const result = await service.askDoubt({
      question: 'What is the capital of France?',
      resourceId: 'res-1',
    });

    expect(result.source).toBe('general_ai');
    expect(spy).toHaveBeenCalled();
  });
});
