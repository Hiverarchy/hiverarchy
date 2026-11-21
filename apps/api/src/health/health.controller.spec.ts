import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { SurrealService } from '../surreal/surreal.service';

describe('HealthController', () => {
  it('should return ok', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: SurrealService,
          useValue: { version: jest.fn().mockResolvedValue('2.0.0') },
        },
      ],
    }).compile();

    const controller = module.get(HealthController);
    expect(controller.live()).toEqual({ status: 'ok' });
  });
});
