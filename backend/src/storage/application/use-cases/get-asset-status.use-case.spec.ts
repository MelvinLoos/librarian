import { Test, TestingModule } from '@nestjs/testing';
import { GetAssetStatusUseCase } from './get-asset-status.use-case';
import { IAssetRepository } from '../ports/asset-repository.interface';
import { Asset } from '../../domain/asset.aggregate';
import { AssetProcessingState } from '../../domain/asset-processing-state.enum';
import { FilePath } from '../../domain/value-objects/file-path.value-object';
import { MimeType } from '../../domain/value-objects/mime-type.value-object';
import { ByteSize } from '../../domain/value-objects/byte-size.value-object';

describe('GetAssetStatusUseCase', () => {
  let useCase: GetAssetStatusUseCase;
  let assetRepository: jest.Mocked<IAssetRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAssetStatusUseCase,
        {
          provide: 'IAssetRepository',
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetAssetStatusUseCase>(GetAssetStatusUseCase);
    assetRepository = module.get('IAssetRepository');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return asset status when asset exists', async () => {
    const assetId = 'test-asset-id';
    const bookId = 123;
    const asset = Asset.reconstruct(
      assetId,
      'FORMAT',
      new FilePath('path/to/file.epub'), // Changed to relative path
      new MimeType('application/epub+zip'),
      new ByteSize(1024),
      AssetProcessingState.READY,
      bookId,
    );
    assetRepository.findById.mockResolvedValue(asset);

    const result = await useCase.execute({ assetId });

    expect(assetRepository.findById).toHaveBeenCalledWith(assetId);
    expect(result).toEqual({
      assetId: asset.id,
      state: asset.state,
      bookId: asset.bookId,
    });
  });

  it('should return null when asset does not exist', async () => {
    const assetId = 'non-existent-asset-id';
    assetRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({ assetId });

    expect(assetRepository.findById).toHaveBeenCalledWith(assetId);
    expect(result).toBeNull();
  });
});
