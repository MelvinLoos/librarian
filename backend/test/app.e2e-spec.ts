import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/app.setup';
import { MetadataExtractionPoolAdapter } from '../src/storage/infrastructure/metadata-extraction-pool.adapter';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MetadataExtractionPoolAdapter)
      .useValue({
        extractMetadata: jest.fn(),
        onModuleDestroy: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    // Boot the same global configuration as the production bootstrap
    // (main.ts), including the SPA fallback middleware.
    configureApp(app);
    await app.init();
  });

  it('serves the SPA entry page at the root path', async () => {
    const res = await request(app.getHttpServer()).get('/');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('<!DOCTYPE html>');
  });

  it('does not intercept API routes with the SPA fallback', async () => {
    const res = await request(app.getHttpServer()).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.text).not.toContain('<!DOCTYPE html>');
  });

  afterEach(async () => {
    await app.close();
  });
});
