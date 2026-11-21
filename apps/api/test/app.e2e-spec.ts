import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SurrealService } from '../src/surreal/surreal.service';

describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const surrealMock = {
      onModuleInit: jest.fn().mockResolvedValue(undefined),
      onModuleDestroy: jest.fn().mockResolvedValue(undefined),
      db: {
        query: jest.fn().mockReturnValue({
          collect: jest.fn().mockResolvedValue([[]]),
        }),
        insert: jest.fn().mockReturnValue({
          collect: jest.fn().mockResolvedValue([[]]),
        }),
      },
      version: jest.fn().mockResolvedValue('surrealdb-test'),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SurrealService)
      .useValue(surrealMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/health', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('GET /api/interests/by-username/nobody returns list', () => {
    return request(app.getHttpServer())
      .get('/api/interests/by-username/nobody')
      .expect(200)
      .expect([]);
  });

  it('GET /api/tags/by-username/nobody returns list', () => {
    return request(app.getHttpServer())
      .get('/api/tags/by-username/nobody')
      .expect(200)
      .expect([]);
  });
});
