import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AssetUploadedEvent } from '../domain/events/asset-uploaded.event';
import { ExtractMetadataUseCase } from '../application/use-cases/extract-metadata.use-case';

@Injectable()
export class AssetUploadedListener {
  private readonly logger = new Logger(AssetUploadedListener.name);

  constructor(
    private readonly extractMetadataUseCase: ExtractMetadataUseCase,
  ) {}

  @OnEvent('AssetUploadedEvent')
  async handleAssetUploadedEvent(event: AssetUploadedEvent) {
    this.logger.log(
      `Handling AssetUploadedEvent for asset ID: ${event.assetId}`,
    );

    try {
      const metadata = await this.extractMetadataUseCase.execute({
        assetId: event.assetId,
        filePath: event.filePath,
      });

      if (metadata === null) {
        this.logger.warn(
          `Asset with ID ${event.assetId} not found; skipping extraction.`,
        );
        return;
      }

      this.logger.log(`Metadata extracted for asset ID: ${event.assetId}`);
    } catch (error: any) {
      this.logger.error(
        `Error processing asset ${event.assetId}: ${error.message}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
