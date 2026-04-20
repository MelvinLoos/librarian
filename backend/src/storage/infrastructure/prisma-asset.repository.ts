import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { IAssetRepository } from '../application/ports/asset-repository.interface';
import { Asset } from '../domain/asset.aggregate';
import { FilePath } from '../domain/value-objects/file-path.value-object';
import { MimeType } from '../domain/value-objects/mime-type.value-object';
import { ByteSize } from '../domain/value-objects/byte-size.value-object';
import { AssetProcessingState } from '../domain/asset-processing-state.enum';

@Injectable()
export class PrismaAssetRepository implements IAssetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(asset: Asset): Promise<void> {
    const metadataPayload = {
      assetId: asset.id,
      filePath: asset.filePath.value,
      mimeType: asset.mimeType.value,
    };

    await this.prisma.data.create({
      data: {
        bookId: asset.bookId ?? 0,
        format: JSON.stringify(metadataPayload),
        uncompressedSize: asset.byteSize.value,
        name: asset.id,
      },
    });
  }

  async findById(id: string): Promise<Asset | null> {
    type DataRecord = {
      format: string;
      uncompressedSize: number;
      bookId: number;
    };

    const data = (await this.prisma.data.findFirst({ where: { name: id } })) as DataRecord | null;
    if (!data) return null;

    const parsed = JSON.parse(data.format) as {
      assetId: string;
      filePath: string;
      mimeType: string;
    };

    return Asset.reconstruct(
      parsed.assetId,
      'FORMAT',
      new FilePath(parsed.filePath),
      new MimeType(parsed.mimeType),
      new ByteSize(data.uncompressedSize),
      AssetProcessingState.READY, // Default state for reconstructed assets
      data.bookId,
    );
  }
}