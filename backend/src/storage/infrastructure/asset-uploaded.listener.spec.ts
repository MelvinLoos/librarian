
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AssetUploadedListener } from './asset-uploaded.listener';
import { MetadataExtractionPoolAdapter } from './metadata-extraction-pool.adapter';
import { IAssetRepository } from '../application/ports/asset-repository.interface';
import { Asset } from '../domain/asset.aggregate';
import { AssetUploadedEvent } from '../domain/events/asset-uploaded.event';
import { AssetProcessingState } from '../domain/asset-processing-state.enum';
import { FilePath } from '../domain/value-objects/file-path.value-object';
import { MimeType } from '../domain/value-objects/mime-type.value-object';
import { ByteSize } from '../domain/value-objects/byte-size.value-object';

describe('AssetUploadedListener', () => {
  let listener: AssetUploadedListener;
  let metadataExtractionPool: jest.Mocked<MetadataExtractionPoolAdapter>;
  let assetRepository: jest.Mocked<IAssetRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const assetId = 'test-asset-id';
  const filePath = 'test/path/to/file.epub';
  const mimeType = 'application/epub+zip';
  const byteSize = 1024;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetUploadedListener,
        {
          provide: MetadataExtractionPoolAdapter,
          useValue: {
            extractMetadata: jest.fn(),
          },
        },
        {
          provide: 'IAssetRepository',
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emitAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    listener = module.get<AssetUploadedListener>(AssetUploadedListener);
    metadataExtractionPool = module.get(MetadataExtractionPoolAdapter);
    assetRepository = module.get('IAssetRepository');
    eventEmitter = module.get(EventEmitter2);
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  it('should process asset, extract metadata, and mark as READY', async () => {
    const asset = Asset.reconstruct(
      assetId,
      'FORMAT',
      new FilePath(filePath),
      new MimeType(mimeType),
      new ByteSize(byteSize),
      AssetProcessingState.UPLOADED,
    );

    assetRepository.findById.mockResolvedValue(asset);
    metadataExtractionPool.extractMetadata.mockResolvedValue({ title: 'Test Title', author: 'Test Author' });

    const event = new AssetUploadedEvent(assetId, filePath, mimeType, byteSize, AssetProcessingState.UPLOADED);
    await listener.handleAssetUploadedEvent(event);

    expect(assetRepository.findById).toHaveBeenCalledWith(assetId);
    expect(asset.state).toBe(AssetProcessingState.READY);
    expect(assetRepository.save).toHaveBeenCalledTimes(2); // startProcessing and markAsReady
    expect(metadataExtractionPool.extractMetadata).toHaveBeenCalledWith(filePath);
  });

  it('should mark asset as FAILED if metadata extraction fails', async () => {
    const asset = Asset.reconstruct(
      assetId,
      'FORMAT',
      new FilePath(filePath),
      new MimeType(mimeType),
      new ByteSize(byteSize),
      AssetProcessingState.UPLOADED,
    );

    assetRepository.findById.mockResolvedValue(asset);
    metadataExtractionPool.extractMetadata.mockRejectedValue(new Error('Extraction failed'));

    const event = new AssetUploadedEvent(assetId, filePath, mimeType, byteSize, AssetProcessingState.UPLOADED);
    await listener.handleAssetUploadedEvent(event);

    expect(assetRepository.findById).toHaveBeenCalledWith(assetId);
    expect(asset.state).toBe(AssetProcessingState.FAILED);
    expect(asset.failureReason).toBe('Extraction failed');
    expect(assetRepository.save).toHaveBeenCalledTimes(2); // startProcessing and markAsFailed
  });

  it('should not process if asset not found', async () => {
    assetRepository.findById.mockResolvedValue(null);

    const event = new AssetUploadedEvent(assetId, filePath, mimeType, byteSize, AssetProcessingState.UPLOADED);
    await listener.handleAssetUploadedEvent(event);

    expect(assetRepository.findById).toHaveBeenCalledWith(assetId);
    expect(metadataExtractionPool.extractMetadata).not.toHaveBeenCalled();
    expect(assetRepository.save).not.toHaveBeenCalled();
  });
});
