import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CatalogModule } from './catalog/catalog.module';
import { IamModule } from './iam/iam.module';
import { StorageModule } from './storage/storage.module';
import { SharedModule } from './shared/shared.module';
import { AssetModule } from './assets/asset.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(), // Enables global event orchestration
    CatalogModule,
    IamModule,
    StorageModule,
    SharedModule,
    AssetModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }