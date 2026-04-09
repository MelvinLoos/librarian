import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UploadAssetUseCase, UploadAssetCommand } from './upload-asset.use-case';
import { IAssetRepository } from '../ports/asset-repository.interface';
import { IFileStorage } from '../ports/file-storage.interface';
import { Asset } from '../../domain/asset.aggregate';

describe('UploadAssetUseCase', () => {
  let useCase: UploadAssetUseCase;
  let assetRepository: jest.Mocked<IAssetRepository>;
  let fileStorage: jest.Mocked<IFileStorage>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    const mockAssetRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    };

    const mockFileStorage = {
      upload: jest.fn(),
    };

    const mockEventEmitter = {
      emitAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadAssetUseCase,
        {
          provide: 'IAssetRepository',
          useValue: mockAssetRepository,
        },
        {
          provide: 'IFileStorage',
          useValue: mockFileStorage,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    useCase = module.get<UploadAssetUseCase>(UploadAssetUseCase);
    assetRepository = module.get('IAssetRepository');
    fileStorage = module.get('IFileStorage');
    eventEmitter = module.get(EventEmitter2);
  });

  it('should successfully upload an asset, save it and emit events', async () => {
    // Arrange
    const command: UploadAssetCommand = {
      file: {
        buffer: Buffer.from('test content'),
        originalName: 'test.epub',
        mimeType: 'application/epub+zip',
        size: 12,
      },
    };

    fileStorage.upload.mockResolvedValue('books/test.epub');
    assetRepository.save.mockResolvedValue(undefined);
    eventEmitter.emitAsync.mockResolvedValue([]);

    // Act
    const result = await useCase.execute(command);

    // Assert
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(fileStorage.upload).toHaveBeenCalledWith({
      buffer: command.file.buffer,
      originalName: command.file.originalName,
      mimeType: command.file.mimeType,
    });
    expect(assetRepository.save).toHaveBeenCalled();
    const savedAsset = assetRepository.save.mock.calls[0][0] as Asset;
    expect(savedAsset.id).toBe(result);
    expect(savedAsset.filePath.value).toBe('books/test.epub');
    
    expect(eventEmitter.emitAsync).toHaveBeenCalledWith('AssetUploadedEvent', expect.objectContaining({
      assetId: result,
      filePath: 'books/test.epub',
    }));
  });

  it('should throw if storage fails', async () => {
    // Arrange
    const command: UploadAssetCommand = {
      file: {
        buffer: Buffer.from('test content'),
        originalName: 'test.epub',
        mimeType: 'application/epub+zip',
        size: 12,
      },
    };

    fileStorage.upload.mockRejectedValue(new Error('Storage failure'));

    // Act & Assert
    await expect(useCase.execute(command)).rejects.toThrow('Storage failure');
    expect(assetRepository.save).not.toHaveBeenCalled();
    expect(eventEmitter.emitAsync).not.toHaveBeenCalled();
  });
});
