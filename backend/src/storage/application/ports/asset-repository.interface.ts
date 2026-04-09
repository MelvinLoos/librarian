import { Asset } from '../../domain/asset.aggregate';

export interface IAssetRepository {
  save(asset: Asset): Promise<void>;
  findById(id: string): Promise<Asset | null>;
}
