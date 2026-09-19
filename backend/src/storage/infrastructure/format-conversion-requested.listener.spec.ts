import { Test, TestingModule } from '@nestjs/testing';
import { FormatConversionRequestedListener } from './format-conversion-requested.listener';
import { ExecuteConversionJobUseCase } from '../application/use-cases/execute-conversion-job.use-case';
import { FormatConversionRequestedEvent } from '../domain/events/format-conversion-requested.event';

describe('FormatConversionRequestedListener', () => {
  let listener: FormatConversionRequestedListener;
  let executeConversionJobUseCase: jest.Mocked<ExecuteConversionJobUseCase>;
  let bookFormatRepository: { getFormatInfo: jest.Mock };
  let fileStorage: { getBookFilePath: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormatConversionRequestedListener,
        {
          provide: ExecuteConversionJobUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: 'IBookFormatRepository',
          useValue: { getFormatInfo: jest.fn() },
        },
        {
          provide: 'IFileStorage',
          useValue: { getBookFilePath: jest.fn() },
        },
      ],
    }).compile();

    listener = module.get(FormatConversionRequestedListener);
    executeConversionJobUseCase = module.get(ExecuteConversionJobUseCase);
    bookFormatRepository = module.get('IBookFormatRepository');
    fileStorage = module.get('IFileStorage');
  });

  it('should resolve the source path and delegate to the execute use case', async () => {
    bookFormatRepository.getFormatInfo.mockResolvedValue({
      bookPath: 'Author/Book',
      fileName: 'Book',
      format: 'EPUB',
      size: 100,
    });
    fileStorage.getBookFilePath.mockImplementation(
      (bookPath: string, fileName: string, format: string) =>
        `/library/${bookPath}/${fileName}.${format.toLowerCase()}`,
    );

    const event = new FormatConversionRequestedEvent(
      'job-1',
      42,
      'EPUB',
      'MOBI',
    );

    await listener.handle(event);

    expect(executeConversionJobUseCase.execute).toHaveBeenCalledWith({
      jobId: 'job-1',
      sourceAbsolutePath: '/library/Author/Book/Book.epub',
      outputRelativePath: '.librarian/conversions/job-1.mobi',
    });
  });

  it('should not rethrow execution failures (the use case handles job state)', async () => {
    bookFormatRepository.getFormatInfo.mockResolvedValue({
      bookPath: 'Author/Book',
      fileName: 'Book',
      format: 'EPUB',
      size: 100,
    });
    fileStorage.getBookFilePath.mockReturnValue(
      '/library/Author/Book/Book.epub',
    );
    executeConversionJobUseCase.execute.mockRejectedValue(new Error('Boom'));

    const event = new FormatConversionRequestedEvent(
      'job-1',
      42,
      'EPUB',
      'MOBI',
    );

    await expect(listener.handle(event)).resolves.toBeUndefined();
  });
});
