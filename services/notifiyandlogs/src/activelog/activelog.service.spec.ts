import { Test, TestingModule } from '@nestjs/testing';
import { ActivelogService } from './activelog.service';

describe('ActivelogService', () => {
  let service: ActivelogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivelogService],
    }).compile();

    service = module.get<ActivelogService>(ActivelogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
