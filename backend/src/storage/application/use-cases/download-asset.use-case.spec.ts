import { Test, TestingModule } from '@nestjs/testing';
import { DownloadAssetUseCase } from './download-asset.use-case';
import { NotFoundException } from '@nestjs/common';
import type {
  IBookFormatRepository,
  BookFormatInfo,
} from '../ports/book-format-repository.interface';
import type { IFileStorage } from '../ports/file-storage.interface';
import { ReadStream } from 'fs';

describe('DownloadAssetUseCase', () => {
  let useCase: DownloadAssetUseCase;
  let bookFormatRepository: jest.Mocked<IBookFormatRepository>;
  let fileStorage: jest.Mocked<IFileStorage>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DownloadAssetUseCase,
        {
          provide: 'IBookFormatRepository',
          useValue: { getFormatInfo: jest.fn() },
        },
        {
          provide: 'IFileStorage',
          useValue: {
            upload: jest.fn(),
            getCoverStream: jest.fn(),
            getBookFilePath: jest.fn(),
            getFileSize: jest.fn(),
            createReadStreamWithRange: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<DownloadAssetUseCase>(DownloadAssetUseCase);
    bookFormatRepository = module.get('IBookFormatRepository');
    fileStorage = module.get('IFileStorage');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should throw NotFoundException when the format info is not found', async () => {
    bookFormatRepository.getFormatInfo.mockResolvedValue(null);

    await expect(
      useCase.execute({ bookId: 1, format: 'EPUB' }),
    ).rejects.toThrow(
      new NotFoundException('Format EPUB not found for book 1'),
    );
  });

  it('should flow correctly and return metadata and stream on success', async () => {
    const mockInfo: BookFormatInfo = {
      bookPath: 'authors/Robert_Martin/CleanCode',
      fileName: 'Clean Code - Robert Martin',
      format: 'EPUB',
      size: 5000,
    };
    const mockStream = {} as ReadStream;

    bookFormatRepository.getFormatInfo.mockResolvedValue(mockInfo);
    fileStorage.getBookFilePath.mockReturnValue(
      '/absolute/path/to/Clean Code - Robert Martin.epub',
    );
    fileStorage.getFileSize.mockResolvedValue(4096);
    fileStorage.createReadStreamWithRange.mockReturnValue(mockStream);

    const result = await useCase.execute({ bookId: 1, format: 'EPUB' });

    expect(bookFormatRepository.getFormatInfo).toHaveBeenCalledWith(1, 'EPUB');
    expect(fileStorage.getBookFilePath).toHaveBeenCalledWith(
      'authors/Robert_Martin/CleanCode',
      'Clean Code - Robert Martin',
      'EPUB',
    );
    expect(fileStorage.getFileSize).toHaveBeenCalledWith(
      '/absolute/path/to/Clean Code - Robert Martin.epub',
    );
    expect(fileStorage.createReadStreamWithRange).toHaveBeenCalledWith(
      '/absolute/path/to/Clean Code - Robert Martin.epub',
    );

    expect(result).toEqual({
      stream: mockStream,
      fileSize: 4096,
      mimeType: 'application/epub+zip',
      fileName: 'Clean_Code_-_Robert_Martin.epub',
    });
  });

  describe('MIME Type Resolution', () => {
    const formats = [
      { format: 'EPUB', expected: 'application/epub+zip' },
      { format: 'epub', expected: 'application/epub+zip' },
      { format: 'PDF', expected: 'application/pdf' },
      { format: 'pdf', expected: 'application/pdf' },
      { format: 'MOBI', expected: 'application/x-mobipocket-ebook' },
      { format: 'mobi', expected: 'application/x-mobipocket-ebook' },
      { format: 'AZW3', expected: 'application/vnd.amazon.ebook' },
      { format: 'azw3', expected: 'application/vnd.amazon.ebook' },
      { format: 'XT', expected: 'application/octet-stream' },
      { format: 'random', expected: 'application/octet-stream' },
    ];

    formats.forEach(({ format, expected }) => {
      it(`should resolve format "${format}" to MIME type "${expected}"`, async () => {
        const mockInfo: BookFormatInfo = {
          bookPath: 'path',
          fileName: 'book',
          format,
          size: 100,
        };
        const mockStream = {} as ReadStream;

        bookFormatRepository.getFormatInfo.mockResolvedValue(mockInfo);
        fileStorage.getBookFilePath.mockReturnValue('/path/to/book');
        fileStorage.getFileSize.mockResolvedValue(100);
        fileStorage.createReadStreamWithRange.mockReturnValue(mockStream);

        const result = await useCase.execute({ bookId: 1, format });
        expect(result.mimeType).toBe(expected);
      });
    });
  });

  describe('Content-Disposition Filename Generation and Sanitization', () => {
    const cases = [
      { fileName: 'SimpleBook', format: 'EPUB', expected: 'SimpleBook.epub' },
      { fileName: 'Clean Code', format: 'EPUB', expected: 'Clean_Code.epub' },
      {
        fileName: 'Multiple    Spaces  In   Name',
        format: 'PDF',
        expected: 'Multiple_Spaces_In_Name.pdf',
      },
      {
        fileName: 'Unsafe/Path/Characters\\File',
        format: 'MOBI',
        expected: 'Unsafe_Path_Characters_File.mobi',
      },
      {
        fileName: 'Book Title: With Special Character?*',
        format: 'AZW3',
        expected: 'Book_Title_With_Special_Character.azw3',
      },
    ];

    cases.forEach(({ fileName, format, expected }) => {
      it(`should format filename "${fileName}" with "${format}" to "${expected}"`, async () => {
        const mockInfo: BookFormatInfo = {
          bookPath: 'path',
          fileName,
          format,
          size: 100,
        };
        const mockStream = {} as ReadStream;

        bookFormatRepository.getFormatInfo.mockResolvedValue(mockInfo);
        fileStorage.getBookFilePath.mockReturnValue('/path/to/book');
        fileStorage.getFileSize.mockResolvedValue(100);
        fileStorage.createReadStreamWithRange.mockReturnValue(mockStream);

        const result = await useCase.execute({ bookId: 1, format });
        expect(result.fileName).toBe(expected);
      });
    });
  });
});
