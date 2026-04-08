import { Test, TestingModule } from '@nestjs/testing';
import { TelecallingService } from './telecalling.service';

describe('TelecallingService', () => {
  let service: TelecallingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TelecallingService],
    }).compile();

    service = module.get<TelecallingService>(TelecallingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
