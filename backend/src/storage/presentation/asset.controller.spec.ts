import { Test, TestingModule } from '@nestjs/testing';
import { AssetController } from './asset.controller';
import { UploadAssetUseCase } from '../application/use-cases/upload-asset.use-case';
import { StreamAssetUseCase } from '../application/use-cases/stream-asset.use-case';
import { DownloadAssetUseCase } from '../application/use-cases/download-asset.use-case';
import { GetAssetStatusUseCase } from '../application/use-cases/get-asset-status.use-case';
import { RequestConversionUseCase } from '../application/use-cases/request-conversion.use-case';
import { GetConversionStatusUseCase } from '../application/use-cases/get-conversion-status.use-case';
import { CancelConversionUseCase } from '../application/use-cases/cancel-conversion.use-case';
import { AssetProcessingState } from '../domain/asset-processing-state.enum';
import { ConversionStatus } from '../domain/conversion-status.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AssetController', () => {
  let controller: AssetController;
  let uploadAssetUseCase: jest.Mocked<UploadAssetUseCase>;
  let streamAssetUseCase: jest.Mocked<StreamAssetUseCase>;
  let downloadAssetUseCase: jest.Mocked<DownloadAssetUseCase>;
  let getAssetStatusUseCase: jest.Mocked<GetAssetStatusUseCase>;
  let requestConversionUseCase: jest.Mocked<RequestConversionUseCase>;
  let getConversionStatusUseCase: jest.Mocked<GetConversionStatusUseCase>;
  let cancelConversionUseCase: jest.Mocked<CancelConversionUseCase>;

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
        {
          provide: RequestConversionUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetConversionStatusUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: CancelConversionUseCase,
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
    requestConversionUseCase = module.get(RequestConversionUseCase);
    getConversionStatusUseCase = module.get(GetConversionStatusUseCase);
    cancelConversionUseCase = module.get(CancelConversionUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('format conversion endpoints', () => {
    it('should request a conversion and return the job id', async () => {
      requestConversionUseCase.execute.mockResolvedValue('job-1');

      const result = await controller.requestConversion(42, {
        targetFormat: 'MOBI',
      });

      expect(requestConversionUseCase.execute).toHaveBeenCalledWith({
        bookId: 42,
        targetFormat: 'MOBI',
      });
      expect(result.jobId).toBe('job-1');
      expect(result.message).toBeDefined();
    });

    it('should return the conversion status', async () => {
      getConversionStatusUseCase.execute.mockResolvedValue({
        jobId: 'job-1',
        status: ConversionStatus.RUNNING,
        progress: 50,
        sourceFormat: 'EPUB',
        targetFormat: 'MOBI',
        updatedAt: new Date(),
      });

      const result = await controller.getConversionStatus('job-1');

      expect(getConversionStatusUseCase.execute).toHaveBeenCalledWith({
        jobId: 'job-1',
      });
      expect(result.status).toBe(ConversionStatus.RUNNING);
    });

    it('should throw NotFoundException when the status is missing', async () => {
      getConversionStatusUseCase.execute.mockResolvedValue(null);

      await expect(controller.getConversionStatus('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should cancel a conversion', async () => {
      cancelConversionUseCase.execute.mockResolvedValue({
        props: {
          id: 'job-1',
          status: ConversionStatus.CANCELLED,
        },
      });

      const result = await controller.cancelConversion('job-1');

      expect(cancelConversionUseCase.execute).toHaveBeenCalledWith({
        jobId: 'job-1',
      });
      expect(result.status).toBe(ConversionStatus.CANCELLED);
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
