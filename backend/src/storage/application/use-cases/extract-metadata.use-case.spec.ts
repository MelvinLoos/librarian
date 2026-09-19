import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ExtractMetadataUseCase,
  ExtractMetadataCommand,
} from './extract-metadata.use-case';
import { Asset } from '../../domain/asset.aggregate';
import { AssetProcessingState } from '../../domain/asset-processing-state.enum';
import { ExtractedMetadata } from '../../domain/value-objects/extracted-metadata.value-object';
import { MetadataExtractedEvent } from '../../domain/events/metadata-extracted.event';
import { FilePath } from '../../domain/value-objects/file-path.value-object';
import { MimeType } from '../../domain/value-objects/mime-type.value-object';
import { ByteSize } from '../../domain/value-objects/byte-size.value-object';

describe('ExtractMetadataUseCase', () => {
  let useCase: ExtractMetadataUseCase;
  let assetRepository: jest.Mocked<any>;
  let metadataExtractor: jest.Mocked<any>;
  let fileStorage: jest.Mocked<any>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let savedStates: AssetProcessingState[];

  const assetId = 'asset-1';
  const filePath = 'test/path/to/book.epub';

  const command: ExtractMetadataCommand = { assetId, filePath };

  const makeAsset = (state: AssetProcessingState): Asset =>
    Asset.reconstruct(
      assetId,
      'FORMAT',
      new FilePath(filePath),
      new MimeType('application/epub+zip'),
      new ByteSize(1024),
      state,
    );

  const metadata = () =>
    new ExtractedMetadata({
      title: 'Dune',
      authors: ['Frank Herbert'],
      isbn: '0-441-17242-7',
      publisher: 'Chilton Books',
      pubDate: '1965-08-01',
      language: 'en',
      description: 'A desert planet saga.',
      cover: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
      coverMimeType: 'image/jpeg',
    });

  beforeEach(async () => {
    savedStates = [];
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExtractMetadataUseCase,
        {
          provide: 'IAssetRepository',
          useValue: {
            findById: jest.fn(),
            save: jest.fn(async (asset: Asset) => {
              savedStates.push(asset.state);
            }),
          },
        },
        {
          provide: 'IMetadataExtractor',
          useValue: { extract: jest.fn() },
        },
        {
          provide: 'IFileStorage',
          useValue: { saveCover: jest.fn() },
        },
        {
          provide: EventEmitter2,
          useValue: { emitAsync: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get(ExtractMetadataUseCase);
    assetRepository = module.get('IAssetRepository');
    metadataExtractor = module.get('IMetadataExtractor');
    fileStorage = module.get('IFileStorage');
    eventEmitter = module.get(EventEmitter2);
  });

  describe('execute', () => {
    it('should orchestrate extraction, persist transitions, save the cover, and emit an event with real metadata', async () => {
      assetRepository.findById.mockResolvedValue(makeAsset(AssetProcessingState.UPLOADED));
      metadataExtractor.extract.mockResolvedValue(metadata());
      fileStorage.saveCover.mockResolvedValue('.librarian/covers/asset-1.jpg');

      const result = await useCase.execute(command);

      expect(assetRepository.findById).toHaveBeenCalledWith(assetId);
      expect(metadataExtractor.extract).toHaveBeenCalledWith(filePath);
      expect(savedStates).toEqual([
        AssetProcessingState.PROCESSING,
        AssetProcessingState.READY,
      ]);
      expect(fileStorage.saveCover).toHaveBeenCalledWith(
        metadata().props.cover,
        assetId,
        'image/jpeg',
      );
      expect(eventEmitter.emitAsync).toHaveBeenCalledTimes(1);
      expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
        'MetadataExtractedEvent',
        expect.any(MetadataExtractedEvent),
      );
      const event = eventEmitter.emitAsync.mock.calls[0][1] as MetadataExtractedEvent;
      expect(event.metadata?.title).toBe('Dune');
      expect(event.metadata?.authors).toEqual(['Frank Herbert']);

      expect(result).not.toBeNull();
      expect(result!.props.title).toBe('Dune');
    });

    it('should return null without touching the extractor when the asset is missing', async () => {
      assetRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(command);

      expect(result).toBeNull();
      expect(metadataExtractor.extract).not.toHaveBeenCalled();
      expect(fileStorage.saveCover).not.toHaveBeenCalled();
      expect(eventEmitter.emitAsync).not.toHaveBeenCalled();
      expect(assetRepository.save).not.toHaveBeenCalled();
    });

    it('should mark the asset as FAILED and rethrow when extraction throws', async () => {
      assetRepository.findById.mockResolvedValue(makeAsset(AssetProcessingState.UPLOADED));
      metadataExtractor.extract.mockRejectedValue(new Error('Boom'));

      await expect(useCase.execute(command)).rejects.toThrow('Boom');

      expect(savedStates).toEqual([
        AssetProcessingState.PROCESSING,
        AssetProcessingState.FAILED,
      ]);
      expect(eventEmitter.emitAsync).not.toHaveBeenCalled();
    });

    it('should mark the asset as FAILED when saving the cover fails', async () => {
      assetRepository.findById.mockResolvedValue(makeAsset(AssetProcessingState.UPLOADED));
      metadataExtractor.extract.mockResolvedValue(metadata());
      fileStorage.saveCover.mockRejectedValue(new Error('Disk full'));

      await expect(useCase.execute(command)).rejects.toThrow('Disk full');

      expect(savedStates).toEqual([
        AssetProcessingState.PROCESSING,
        AssetProcessingState.FAILED,
      ]);
      expect(eventEmitter.emitAsync).not.toHaveBeenCalled();
    });
  });
});