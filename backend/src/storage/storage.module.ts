import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AssetController } from './presentation/asset.controller';
import { UploadAssetUseCase } from './application/use-cases/upload-asset.use-case';

@Module({
  imports: [],
  controllers: [AssetController],
  providers: [
    UploadAssetUseCase,
  ],
  exports: [UploadAssetUseCase],
})
export class StorageModule {}
