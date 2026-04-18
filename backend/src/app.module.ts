import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerModule } from 'nestjs-pino';
import * as crypto from 'crypto';
import { CatalogModule } from './catalog/catalog.module';
import { IamModule } from './iam/iam.module';
import { StorageModule } from './storage/storage.module';
import { SharedModule } from './shared/shared.module';
import { AssetModule } from './assets/asset.module';
import { ReadingModule } from './reading/reading.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        // Generate a unique traceId per request
        genReqId: (req) => req.id ?? crypto.randomUUID(),
        // Attach traceId as a top-level log property
        customProps: (req) => ({ traceId: req.id }),
        // Concise success message: [GET] /api/books - 200
        customSuccessMessage: (req, res) =>
          `[${req.method}] ${req.url} - ${res.statusCode}`,
        // Concise error message: [POST] /api/auth/login - 401 Unauthorized
        customErrorMessage: (req, res, err: any) =>
          `[${req.method}] ${req.url} - ${err?.status ?? res.statusCode} ${err?.message ?? ''}`.trim(),
        // Trim down the req/res objects to avoid verbose dumps
        serializers: {
          req: (req) => ({ method: req.method, url: req.url }),
          res: (res) => ({ statusCode: res.statusCode }),
        },
      },
    }),
    EventEmitterModule.forRoot(), // Enables global event orchestration
    CatalogModule,
    IamModule,
    StorageModule,
    SharedModule,
    AssetModule,
    ReadingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}