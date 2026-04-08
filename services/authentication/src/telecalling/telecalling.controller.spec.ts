import { Test, TestingModule } from '@nestjs/testing';
import { TelecallingController } from './telecalling.controller';

describe('TelecallingController', () => {
  let controller: TelecallingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelecallingController],
    }).compile();

    controller = module.get<TelecallingController>(TelecallingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
