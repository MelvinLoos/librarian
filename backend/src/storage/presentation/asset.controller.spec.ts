import { Test, TestingModule } from '@nestjs/testing';
import { AssetController } from './asset.controller';
import { UploadAssetUseCase } from '../application/use-cases/upload-asset.use-case';
import { StreamAssetUseCase } from '../application/use-cases/stream-asset.use-case';
import { DownloadAssetUseCase } from '../application/use-cases/download-asset.use-case';
import { GetAssetStatusUseCase } from '../application/use-cases/get-asset-status.use-case';
import { AssetProcessingState } from '../domain/asset-processing-state.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AssetController', () => {
  let controller: AssetController;
  let uploadAssetUseCase: jest.Mocked<UploadAssetUseCase>;
  let streamAssetUseCase: jest.Mocked<StreamAssetUseCase>;
  let downloadAssetUseCase: jest.Mocked<DownloadAssetUseCase>;
  let getAssetStatusUseCase: jest.Mocked<GetAssetStatusUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetController],
      providers: [
        {
          provide: UploadAssetUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: StreamAssetUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: DownloadAssetUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetAssetStatusUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AssetController>(AssetController);
    uploadAssetUseCase = module.get(UploadAssetUseCase);
    streamAssetUseCase = module.get(StreamAssetUseCase);
    downloadAssetUseCase = module.get(DownloadAssetUseCase);
    getAssetStatusUseCase = module.get(GetAssetStatusUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should return the asset id and the upload state', async () => {
      uploadAssetUseCase.execute.mockResolvedValue('asset-123');

      const file = {
        originalname: 'book.epub',
        mimetype: 'application/epub+zip',
        size: 100,
        buffer: Buffer.from('content'),
      };

      const result = await controller.uploadFile(file);

      expect(uploadAssetUseCase.execute).toHaveBeenCalledWith({
        file: {
          buffer: file.buffer,
          originalName: 'book.epub',
          mimeType: 'application/epub+zip',
          size: 100,
        },
      });
      expect(result.id).toBe('asset-123');
      expect(result.state).toBe(AssetProcessingState.UPLOADED);
      expect(result.message).toBeDefined();
    });

    it('should throw BadRequestException when no file is provided', async () => {
      await expect(controller.uploadFile(null)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getAssetStatus', () => {
    it('should return asset status', async () => {
      const assetId = 'test-asset-id';
      const expectedStatus = {
        assetId,
        state: AssetProcessingState.READY,
        bookId: 123,
      };
      getAssetStatusUseCase.execute.mockResolvedValue(expectedStatus);

      const result = await controller.getAssetStatus(assetId);

      expect(getAssetStatusUseCase.execute).toHaveBeenCalledWith({ assetId });
      expect(result).toEqual(expectedStatus);
    });

    it('should throw NotFoundException if asset status is null', async () => {
      const assetId = 'non-existent-asset-id';
      getAssetStatusUseCase.execute.mockResolvedValue(null);

      await expect(controller.getAssetStatus(assetId)).rejects.toThrow(
        NotFoundException,
      );
      expect(getAssetStatusUseCase.execute).toHaveBeenCalledWith({ assetId });
    });
  });
});
