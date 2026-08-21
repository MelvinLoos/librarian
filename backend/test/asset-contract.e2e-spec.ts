import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MetadataExtractionPoolAdapter } from '../src/storage/infrastructure/metadata-extraction-pool.adapter';
import { IUserRepository } from '../src/iam/application/ports/user.repository.interface';
import { JwtService } from '@nestjs/jwt';
import { StreamAssetUseCase } from '../src/storage/application/use-cases/stream-asset.use-case';
import { Readable } from 'stream';

describe('AssetController Contract (e2e)', () => {
  let app: INestApplication<App>;
  let swaggerDoc: any;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MetadataExtractionPoolAdapter)
      .useValue({
        extractMetadata: jest.fn(),
        onModuleDestroy: jest.fn(),
      })
      .overrideProvider(IUserRepository)
      .useValue({
        findById: jest.fn().mockResolvedValue({
          id: 'user-123',
          email: 'test@example.com',
          role: 'ADMIN',
        }),
      })
      .overrideProvider(StreamAssetUseCase)
      .useValue({
        execute: jest.fn().mockImplementation(async (input) => {
          const content = 'Hello, stream contract matches actual response!';
          const mockFileContent = Buffer.from(content);
          const fileSize = mockFileContent.length;

          if (input.rangeHeader) {
            const parts = input.rangeHeader.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const contentLength = end - start + 1;

            // Slice the buffer to provide exactly the requested range size
            const slicedContent = mockFileContent.subarray(start, end + 1);
            const stream = Readable.from(slicedContent);

            return {
              stream,
              fileSize,
              start,
              end,
              contentLength,
              mimeType: 'application/epub+zip',
            };
          }

          const stream = Readable.from(mockFileContent);
          return {
            stream,
            fileSize,
            start: 0,
            end: fileSize - 1,
            contentLength: fileSize,
            mimeType: 'application/epub+zip',
          };
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');

    // Build swagger doc exactly as in main.ts
    const config = new DocumentBuilder()
      .setTitle('Librarian API')
      .setVersion('1.0')
      .build();
    swaggerDoc = SwaggerModule.createDocument(app, config);

    await app.init();

    // Generate signed token
    const jwtService = app.get(JwtService);
    authToken = jwtService.sign({
      sub: 'user-123',
      email: 'test@example.com',
      role: 'ADMIN',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Swagger/OpenAPI Schema Validation', () => {
    it('should expose the Swagger JSON schema', () => {
      expect(swaggerDoc).toBeDefined();
      expect(swaggerDoc.paths).toBeDefined();
    });

    it('/api/assets/books/{id}/stream endpoint should be documented in Swagger with expected HTTP responses', () => {
      const streamPath = swaggerDoc.paths['/api/assets/books/{id}/stream'];
      expect(streamPath).toBeDefined();
      expect(streamPath.get).toBeDefined();

      const responses = streamPath.get.responses;
      expect(responses).toBeDefined();
      // Verify both 200 and 206 responses are specifically documented
      expect(responses['200']).toBeDefined();
      expect(responses['206']).toBeDefined();
    });
  });

  describe('Actual Implementation Validation (Contract Matching Checks)', () => {
    it('GET /api/assets/books/:id/stream should return HTTP 200 with full content and match Swagger schema', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/assets/books/42/stream')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/epub+zip');
      expect(response.headers['content-length']).toBeDefined();
      expect(response.headers['accept-ranges']).toBe('bytes');
      expect(response.text).toContain('Hello, stream contract matches');
    });

    it('GET /api/assets/books/:id/stream with Range header should return HTTP 206, matching range contract', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/assets/books/42/stream')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Range', 'bytes=0-10')
        .expect(206);

      expect(response.headers['content-type']).toBe('application/epub+zip');
      expect(response.headers['content-range']).toMatch(/^bytes 0-10\/\d+/);
      expect(response.headers['content-length']).toBeDefined();
      expect(response.headers['accept-ranges']).toBe('bytes');
    });
  });
});

// Helper matcher for checking values inside an array
expect.extend({
  toBeOneOf(received, argument) {
    const pass = argument.includes(received);
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be one of [${argument.join(', ')}]`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be one of [${argument.join(', ')}]`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(argument: any[]): R;
    }
  }
}
