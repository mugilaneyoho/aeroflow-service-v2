import { Test, TestingModule } from '@nestjs/testing';
import { ActivelogController } from './activelog.controller';

describe('ActivelogController', () => {
  let controller: ActivelogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivelogController],
    }).compile();

    controller = module.get<ActivelogController>(ActivelogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
