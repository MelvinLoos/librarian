import { Asset } from '../domain/asset.aggregate';
import { FilePath } from '../domain/value-objects/file-path.value-object';
import { MimeType } from '../domain/value-objects/mime-type.value-object';
import { ByteSize } from '../domain/value-objects/byte-size.value-object';
import { PrismaAssetRepository } from './prisma-asset.repository';

describe('PrismaAssetRepository', () => {
  const createMock = jest.fn();
  const findFirstMock = jest.fn();
  const prismaMock = {
    data: {
      create: createMock,
      findFirst: findFirstMock,
    },
  } as unknown as any;

  let repository: PrismaAssetRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PrismaAssetRepository(prismaMock);
  });

  it('should persist asset metadata to the legacy data table', async () => {
    const asset = Asset.upload(
      'asset-123',
      'FORMAT',
      new FilePath('.librarian/assets/test.epub'),
      new MimeType('application/epub+zip'),
      new ByteSize(1024),
    );

    await repository.save(asset);

    expect(createMock).toHaveBeenCalledWith({
      data: {
        bookId: 0,
        format: expect.stringContaining('"assetId":"asset-123"'),
        uncompressedSize: 1024,
        name: 'asset-123',
      },
    });
  });

  it('should reconstruct an asset from the legacy data record', async () => {
    const datasource = {
      name: 'asset-123',
      format: JSON.stringify({
        assetId: 'asset-123',
        filePath: '.librarian/assets/test.epub',
        mimeType: 'application/epub+zip',
      }),
      uncompressedSize: 1024,
      bookId: 42,
    };

    findFirstMock.mockResolvedValue(datasource);

    const result = await repository.findById('asset-123');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('asset-123');
    expect(result?.filePath.value).toBe('.librarian/assets/test.epub');
    expect(result?.mimeType.value).toBe('application/epub+zip');
    expect(result?.byteSize.value).toBe(1024);
    expect(result?.bookId).toBe(42);
  });

  it('should return null when the asset cannot be found', async () => {
    findFirstMock.mockResolvedValue(null);
    const result = await repository.findById('missing-asset');
    expect(result).toBeNull();
  });
});
