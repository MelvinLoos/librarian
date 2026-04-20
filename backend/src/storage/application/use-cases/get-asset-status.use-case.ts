import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IAssetRepository } from '../ports/asset-repository.interface';
import { AssetProcessingState } from '../../domain/asset-processing-state.enum';

export interface GetAssetStatusQuery {
  assetId: string;
}

export interface AssetStatusResult {
  assetId: string;
  state: AssetProcessingState;
  bookId?: number;
}

@Injectable()
export class GetAssetStatusUseCase {
  private readonly logger = new Logger(GetAssetStatusUseCase.name);

  constructor(
    @Inject('IAssetRepository')
    private readonly assetRepository: IAssetRepository,
  ) {}

  async execute(query: GetAssetStatusQuery): Promise<AssetStatusResult | null> {
    this.logger.log(`Fetching status for asset ID: ${query.assetId}`);

    const asset = await this.assetRepository.findById(query.assetId);

    if (!asset) {
      this.logger.warn(`Asset with ID ${query.assetId} not found.`);
      return null;
    }

    return {
      assetId: asset.id,
      state: asset.state,
      bookId: asset.bookId,
    };
  }
}
