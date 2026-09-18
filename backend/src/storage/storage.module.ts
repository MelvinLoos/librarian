import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SharedModule } from '../shared/shared.module';
import { AssetController } from './presentation/asset.controller';
import { CoverController } from './presentation/cover.controller';
import { UploadAssetUseCase } from './application/use-cases/upload-asset.use-case';
import { PrismaAssetRepository } from './infrastructure/prisma-asset.repository';
import { LocalFileStorage } from './infrastructure/local-file.storage';
import { PrismaLegacyBookRepository } from './infrastructure/prisma-legacy-book.repository';
import { StreamAssetUseCase } from './application/use-cases/stream-asset.use-case';
import { DownloadAssetUseCase } from './application/use-cases/download-asset.use-case';
import { GetCoverStreamUseCase } from './application/use-cases/get-cover-stream.use-case';
import { PrismaBookFormatRepository } from './infrastructure/prisma-book-format.repository';
import { MetadataExtractionPoolAdapter } from './infrastructure/metadata-extraction-pool.adapter';
import { AssetUploadedListener } from './infrastructure/asset-uploaded.listener';
import { GetAssetStatusUseCase } from './application/use-cases/get-asset-status.use-case';
@Module({
  imports: [SharedModule, EventEmitterModule.forRoot()],
  controllers: [AssetController, CoverController],
  providers: [
    UploadAssetUseCase,
    StreamAssetUseCase,
    DownloadAssetUseCase,
    GetCoverStreamUseCase,
    GetAssetStatusUseCase,
    MetadataExtractionPoolAdapter,
    AssetUploadedListener,
    {
      provide: 'IAssetRepository',
      useClass: PrismaAssetRepository,
    },
    {
      provide: 'ILegacyBookRepository',
      useClass: PrismaLegacyBookRepository,
    },
    {
      provide: 'IFileStorage',
      useClass: LocalFileStorage,
    },
    {
      provide: 'IBookFormatRepository',
      useClass: PrismaBookFormatRepository,
    },
  ],
  exports: [UploadAssetUseCase, StreamAssetUseCase, DownloadAssetUseCase],
})
export class StorageModule {}
