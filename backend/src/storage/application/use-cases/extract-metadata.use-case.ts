import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ExtractedMetadata } from '../../domain/value-objects/extracted-metadata.value-object';
import type { IAssetRepository } from '../ports/asset-repository.interface';
import type { IMetadataExtractor } from '../ports/metadata-extractor.interface';
import type { IFileStorage } from '../ports/file-storage.interface';

export interface ExtractMetadataCommand {
  assetId: string;
  filePath: string;
}

@Injectable()
export class ExtractMetadataUseCase {
  constructor(
    @Inject('IAssetRepository')
    private readonly assetRepository: IAssetRepository,
    @Inject('IMetadataExtractor')
    private readonly metadataExtractor: IMetadataExtractor,
    @Inject('IFileStorage')
    private readonly fileStorage: IFileStorage,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    command: ExtractMetadataCommand,
  ): Promise<ExtractedMetadata | null> {
    throw new Error('Not implemented');
  }
}