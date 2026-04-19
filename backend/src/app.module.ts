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
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../..', 'frontend', '.output', 'public'),
      exclude: ['/api/(.*)'],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req) => req.id ?? crypto.randomUUID(),
        customProps: (req) => ({ traceId: req.id }),
        customSuccessMessage: (req, res) =>
          `[${req.method}] ${req.url} - ${res.statusCode}`,
        customErrorMessage: (req, res, err: any) =>
          `[${req.method}] ${req.url} - ${err?.status ?? res.statusCode} ${err?.message ?? ''}`.trim(),
        serializers: {
          req: (req) => ({ method: req.method, url: req.url }),
          res: (res) => ({ statusCode: res.statusCode }),
        },
      },
    }),
    EventEmitterModule.forRoot(),
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