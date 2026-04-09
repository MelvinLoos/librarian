import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CatalogModule } from './catalog/catalog.module';
import { IamModule } from './iam/iam.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(), // Enables global event orchestration
    CatalogModule,
    IamModule,
    StorageModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }