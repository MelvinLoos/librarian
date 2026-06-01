/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StreamAssetUseCase } from './stream-asset.use-case';
import { IBookFormatRepository } from '../ports/book-format-repository.interface';
import { IFileStorage } from '../ports/file-storage.interface';
import { ReadStream } from 'fs';

describe('StreamAssetUseCase', () => {
  let useCase: StreamAssetUseCase;
  let bookFormatRepository: jest.Mocked<IBookFormatRepository>;
  let fileStorage: jest.Mocked<IFileStorage>;

  beforeEach(async () => {
    const mockBookFormatRepository = { getFormatInfo: jest.fn() };
    const mockFileStorage = {
      upload: jest.fn(),
      getCoverStream: jest.fn(),
      getBookFilePath: jest.fn(),
      getFileSize: jest.fn(),
      createReadStreamWithRange: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreamAssetUseCase,
        {
          provide: 'IBookFormatRepository',
          useValue: mockBookFormatRepository,
        },
        { provide: 'IFileStorage', useValue: mockFileStorage },
      ],
    }).compile();

    useCase = module.get<StreamAssetUseCase>(StreamAssetUseCase);
    bookFormatRepository = module.get('IBookFormatRepository');
    fileStorage = module.get('IFileStorage');
  });

  const mockInfo = {
    bookPath: 'folder',
    fileName: 'b.epub',
    format: 'EPUB',
    size: 5000,
  };
  const absolutePath = '/abs/b.epub';
  const dummyStream = {} as ReadStream;

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should throw NotFoundException when book format is not found', async () => {
    bookFormatRepository.getFormatInfo.mockResolvedValue(null);
    await expect(
      useCase.execute({ bookId: 1, format: 'epub' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should stream full file when no rangeHeader is provided', async () => {
    bookFormatRepository.getFormatInfo.mockResolvedValue(mockInfo);
    fileStorage.getBookFilePath.mockReturnValue(absolutePath);
    fileStorage.getFileSize.mockResolvedValue(5000);
    fileStorage.createReadStreamWithRange.mockReturnValue(dummyStream);

    const result = await useCase.execute({ bookId: 1 });
    expect(result).toEqual({
      stream: dummyStream,
      fileSize: 5000,
      start: 0,
      end: 4999,
      contentLength: 5000,
      mimeType: 'application/epub+zip',
    });
    expect(fileStorage.createReadStreamWithRange).toHaveBeenCalledWith(
      absolutePath,
      0,
      4999,
    );
  });

  it('should stream partial content when valid rangeHeader is provided', async () => {
    bookFormatRepository.getFormatInfo.mockResolvedValue(mockInfo);
    fileStorage.getBookFilePath.mockReturnValue(absolutePath);
    fileStorage.getFileSize.mockResolvedValue(5000);
    fileStorage.createReadStreamWithRange.mockReturnValue(dummyStream);

    const result = await useCase.execute({
      bookId: 1,
      rangeHeader: 'bytes=100-200',
    });
    expect(result).toEqual({
      stream: dummyStream,
      fileSize: 5000,
      start: 100,
      end: 200,
      contentLength: 101,
      mimeType: 'application/epub+zip',
    });
    expect(fileStorage.createReadStreamWithRange).toHaveBeenCalledWith(
      absolutePath,
      100,
      200,
    );
  });
  it('should clamp end to fileSize - 1 when end is out-of-bounds', async () => {
    bookFormatRepository.getFormatInfo.mockResolvedValue(mockInfo);
    fileStorage.getBookFilePath.mockReturnValue(absolutePath);
    fileStorage.getFileSize.mockResolvedValue(5000);
    fileStorage.createReadStreamWithRange.mockReturnValue(dummyStream);

    const result = await useCase.execute({
      bookId: 1,
      rangeHeader: 'bytes=3000-6000',
    });
    expect(result).toEqual({
      stream: dummyStream,
      fileSize: 5000,
      start: 3000,
      end: 4999,
      contentLength: 2000,
      mimeType: 'application/epub+zip',
    });
    expect(fileStorage.createReadStreamWithRange).toHaveBeenCalledWith(
      absolutePath,
      3000,
      4999,
    );
  });

  it('should throw BadRequestException when start is out-of-bounds (start >= fileSize)', async () => {
    bookFormatRepository.getFormatInfo.mockResolvedValue(mockInfo);
    fileStorage.getBookFilePath.mockReturnValue(absolutePath);
    fileStorage.getFileSize.mockResolvedValue(5000);

    await expect(
      useCase.execute({ bookId: 1, rangeHeader: 'bytes=5000-5001' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when start is negative', async () => {
    bookFormatRepository.getFormatInfo.mockResolvedValue(mockInfo);
    fileStorage.getBookFilePath.mockReturnValue(absolutePath);
    fileStorage.getFileSize.mockResolvedValue(5000);

    await expect(
      useCase.execute({ bookId: 1, rangeHeader: 'bytes=-500-1000' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when start is greater than end', async () => {
    bookFormatRepository.getFormatInfo.mockResolvedValue(mockInfo);
    fileStorage.getBookFilePath.mockReturnValue(absolutePath);
    fileStorage.getFileSize.mockResolvedValue(5000);

    await expect(
      useCase.execute({ bookId: 1, rangeHeader: 'bytes=500-200' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException for completely invalid range format', async () => {
    bookFormatRepository.getFormatInfo.mockResolvedValue(mockInfo);
    fileStorage.getBookFilePath.mockReturnValue(absolutePath);
    fileStorage.getFileSize.mockResolvedValue(5000);

    await expect(
      useCase.execute({ bookId: 1, rangeHeader: 'foo=some-nonsense' }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      useCase.execute({ bookId: 1, rangeHeader: 'bytes=abc-def' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should fall back to default mimeType if format is unknown', async () => {
    const customInfo = { ...mockInfo, format: 'XYZ' };
    bookFormatRepository.getFormatInfo.mockResolvedValue(customInfo);
    fileStorage.getBookFilePath.mockReturnValue(absolutePath);
    fileStorage.getFileSize.mockResolvedValue(5000);
    fileStorage.createReadStreamWithRange.mockReturnValue(dummyStream);

    const result = await useCase.execute({ bookId: 1, format: 'xyz' });
    expect(result.mimeType).toBe('application/octet-stream');
  });
});
