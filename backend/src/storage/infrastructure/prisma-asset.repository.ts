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
      state: asset.state,
      failureReason: asset.failureReason,
    };

    // Upsert by asset id: replace any prior snapshot so findById always
    // resolves the most recent state transition.
    await this.prisma.data.deleteMany({
      where: { name: asset.id },
    });
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

    const data = (await this.prisma.data.findFirst({
      where: { name: id },
      orderBy: { id: 'desc' },
    })) as DataRecord | null;
    if (!data) return null;

    const parsed = JSON.parse(data.format) as {
      assetId: string;
      filePath: string;
      mimeType: string;
      state?: string;
      failureReason?: string;
    };

    const validStates = Object.values(AssetProcessingState) as string[];
    const state =
      parsed.state !== undefined && validStates.includes(parsed.state)
        ? (parsed.state as AssetProcessingState)
        : AssetProcessingState.READY; // Backwards compatible default

    return Asset.reconstruct(
      parsed.assetId,
      'FORMAT',
      new FilePath(parsed.filePath),
      new MimeType(parsed.mimeType),
      new ByteSize(data.uncompressedSize),
      state,
      data.bookId,
      parsed.failureReason,
    );
  }
}
