import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AssetController } from './presentation/asset.controller';
import { UploadAssetUseCase } from './application/use-cases/upload-asset.use-case';
import { Asset } from './domain/asset.aggregate';
import { IAssetRepository } from './application/ports/asset-repository.interface';
import { IFileStorage } from './application/ports/file-storage.interface';

class InMemoryAssetRepository implements IAssetRepository {
  private assets: Map<string, Asset> = new Map();

  async save(asset: Asset): Promise<void> {
    this.assets.set(asset.id, asset);
  }

  async findById(id: string): Promise<Asset | null> {
    return this.assets.get(id) || null;
  }
}

class LocalFileStorage implements IFileStorage {
  async upload(file: { buffer: Buffer; originalName: string; mimeType: string }): Promise<string> {
    // For now we just return a fake path since this is an in-memory mock for Sprint 1
    return `/uploads/${Date.now()}-${file.originalName}`;
  }
}

@Module({
  imports: [],
  controllers: [AssetController],
  providers: [
    UploadAssetUseCase,
    {
      provide: 'IAssetRepository',
      useClass: InMemoryAssetRepository,
    },
    {
      provide: 'IFileStorage',
      useClass: LocalFileStorage,
    },
  ],
  exports: [UploadAssetUseCase],
})
export class StorageModule {}
