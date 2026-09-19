import { Test, TestingModule } from '@nestjs/testing';
import { AssetUploadedListener } from './asset-uploaded.listener';
import { ExtractMetadataUseCase } from '../application/use-cases/extract-metadata.use-case';
import { AssetUploadedEvent } from '../domain/events/asset-uploaded.event';
import { AssetProcessingState } from '../domain/asset-processing-state.enum';
import { ExtractedMetadata } from '../domain/value-objects/extracted-metadata.value-object';

describe('AssetUploadedListener', () => {
  let listener: AssetUploadedListener;
  let extractMetadataUseCase: jest.Mocked<ExtractMetadataUseCase>;

  const assetId = 'test-asset-id';
  const filePath = 'test/path/to/file.epub';
  const mimeType = 'application/epub+zip';
  const byteSize = 1024;

  const makeEvent = () =>
    new AssetUploadedEvent(
      assetId,
      filePath,
      mimeType,
      byteSize,
      AssetProcessingState.UPLOADED,
    );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetUploadedListener,
        {
          provide: ExtractMetadataUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    listener = module.get(AssetUploadedListener);
    extractMetadataUseCase = module.get(ExtractMetadataUseCase);
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  it('should delegate extraction to the ExtractMetadataUseCase', async () => {
    extractMetadataUseCase.execute.mockResolvedValue(
      new ExtractedMetadata({ title: 'Dune', authors: ['Frank Herbert'] }),
    );

    await listener.handleAssetUploadedEvent(makeEvent());

    expect(extractMetadataUseCase.execute).toHaveBeenCalledWith({
      assetId,
      filePath,
    });
  });

  it('should tolerate a null result (asset not found)', async () => {
    extractMetadataUseCase.execute.mockResolvedValue(null);

    await expect(
      listener.handleAssetUploadedEvent(makeEvent()),
    ).resolves.toBeUndefined();
    expect(extractMetadataUseCase.execute).toHaveBeenCalledWith({
      assetId,
      filePath,
    });
  });

  it('should not rethrow failures raised by the use case (it handles asset state)', async () => {
    extractMetadataUseCase.execute.mockRejectedValue(new Error('Boom'));

    await expect(
      listener.handleAssetUploadedEvent(makeEvent()),
    ).resolves.toBeUndefined();
    expect(extractMetadataUseCase.execute).toHaveBeenCalledWith({
      assetId,
      filePath,
    });
  });
});
