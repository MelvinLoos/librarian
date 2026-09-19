import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AssetProcessingState } from '../../domain/asset-processing-state.enum';
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
  private readonly logger = new Logger(ExtractMetadataUseCase.name);

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
    const { assetId, filePath } = command;

    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      this.logger.warn(
        `Asset with ID ${assetId} not found; nothing to extract.`,
      );
      return null;
    }

    try {
      asset.startProcessing();
      await this.assetRepository.save(asset);

      const metadata = await this.metadataExtractor.extract(filePath);

      if (metadata.props.cover !== undefined) {
        const coverPath = await this.fileStorage.saveCover(
          metadata.props.cover,
          assetId,
          metadata.props.coverMimeType!,
        );
        this.logger.log(
          `Saved extracted cover for asset ${assetId} to ${coverPath}`,
        );
      }

      asset.markAsReady(metadata);
      await this.assetRepository.save(asset);

      for (const event of asset.domainEvents) {
        await this.eventEmitter.emitAsync(event.getName(), event);
      }
      asset.clearEvents();

      this.logger.log(
        `Metadata extracted for asset ${assetId}: "${metadata.props.title}"`,
      );

      return metadata;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Metadata extraction failed for asset ${assetId}: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (asset.state !== AssetProcessingState.READY) {
        asset.markAsFailed(message);
        await this.assetRepository.save(asset);
      }
      asset.clearEvents();
      throw error;
    }
  }
}
