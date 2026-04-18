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
        genReqId: (req) => {
          return req.id || crypto.randomUUID();
        },
      },
    }),
    EventEmitterModule.forRoot(), // Enables global event orchestration
    CatalogModule,
    IamModule,
    StorageModule,
    SharedModule,
    AssetModule,
    ReadingModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }