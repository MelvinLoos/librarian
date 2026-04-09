import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Asset } from '../../domain/asset.aggregate';
import { FilePath } from '../../domain/value-objects/file-path.value-object';
import { MimeType } from '../../domain/value-objects/mime-type.value-object';
import { ByteSize } from '../../domain/value-objects/byte-size.value-object';
import type { IAssetRepository } from '../ports/asset-repository.interface';
import type { IFileStorage } from '../ports/file-storage.interface';
import { randomUUID } from 'crypto';

export interface UploadAssetCommand {
  file: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
  };
}

@Injectable()
export class UploadAssetUseCase {
  constructor(
    @Inject('IAssetRepository')
    private readonly assetRepository: IAssetRepository,
    @Inject('IFileStorage')
    private readonly fileStorage: IFileStorage,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: UploadAssetCommand): Promise<string> {
    const { file } = command;

    // 1. Upload file to physical storage
    const storedPath = await this.fileStorage.upload({
      buffer: file.buffer,
      originalName: file.originalName,
      mimeType: file.mimeType,
    });

    // 2. Create Asset Aggregate Root
    const assetId = randomUUID();
    const asset = Asset.upload(
      assetId,
      'FORMAT',
      new FilePath(storedPath),
      new MimeType(file.mimeType),
      new ByteSize(file.size),
    );

    // 3. Persist metadata
    await this.assetRepository.save(asset);

    // 4. Dispatch Domain Events
    for (const event of asset.domainEvents) {
      await this.eventEmitter.emitAsync(event.getName(), event);
    }
    
    asset.clearEvents();

    return assetId;
  }
}
