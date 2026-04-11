import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SharedModule } from '../shared/shared.module';
import { AssetController } from './presentation/asset.controller';
import { UploadAssetUseCase } from './application/use-cases/upload-asset.use-case';
import { PrismaAssetRepository } from './infrastructure/prisma-asset.repository';
import { LocalFileStorage } from './infrastructure/local-file.storage';

@Module({
  imports: [SharedModule, EventEmitterModule.forRoot()],
  controllers: [AssetController],
  providers: [
    UploadAssetUseCase,
    {
      provide: 'IAssetRepository',
      useClass: PrismaAssetRepository,
    },
    {
      provide: 'IFileStorage',
      useClass: LocalFileStorage,
    },
  ],
  exports: [UploadAssetUseCase],
})
export class StorageModule {}
