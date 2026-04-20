import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AssetUploadedEvent } from '../domain/events/asset-uploaded.event';
import { MetadataExtractionPoolAdapter } from './metadata-extraction-pool.adapter';
import type { IAssetRepository } from '../application/ports/asset-repository.interface';

@Injectable()
export class AssetUploadedListener {
  private readonly logger = new Logger(AssetUploadedListener.name);

  constructor(
    private readonly metadataExtractionPool: MetadataExtractionPoolAdapter,
    @Inject('IAssetRepository')
    private readonly assetRepository: IAssetRepository,
  ) {}

  @OnEvent('AssetUploadedEvent')
  async handleAssetUploadedEvent(event: AssetUploadedEvent) {
    this.logger.log(`Handling AssetUploadedEvent for asset ID: ${event.assetId}`);

    let asset = await this.assetRepository.findById(event.assetId);

    if (!asset) {
      this.logger.error(`Asset with ID ${event.assetId} not found.`);
      return;
    }

    try {
      asset.startProcessing();
      await this.assetRepository.save(asset);

      // We don't use the metadata here, but the worker returns it.
      // The ruling states to mock the extraction, so we just call the worker.
      await this.metadataExtractionPool.extractMetadata(event.filePath);

      asset = await this.assetRepository.findById(event.assetId); // Re-fetch to ensure latest state
      if (!asset) {
        this.logger.error(`Asset with ID ${event.assetId} not found after processing.`);
        return;
      }

      asset.markAsReady();
      await this.assetRepository.save(asset);

      this.logger.log(`Metadata extracted and asset marked as READY for asset ID: ${event.assetId}`);
    } catch (error: any) {
      this.logger.error(`Error processing asset ${event.assetId}: ${error.message}`);
      asset = await this.assetRepository.findById(event.assetId); // Re-fetch to ensure latest state
      if (asset) {
        asset.markAsFailed(error.message);
        await this.assetRepository.save(asset);
      }
    }
  }
}
