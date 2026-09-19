import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  RequestConversionUseCase,
  RequestConversionCommand,
} from './request-conversion.use-case';
import { FormatConversionRequestedEvent } from '../../domain/events/format-conversion-requested.event';
import type { IBookFormatRepository } from '../ports/book-format-repository.interface';
import type { ConversionJobRepositoryInterface } from '../ports/conversion-job-repository.interface';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('RequestConversionUseCase', () => {
  let useCase: RequestConversionUseCase;
  let bookFormatRepository: jest.Mocked<IBookFormatRepository>;
  let conversionJobRepository: jest.Mocked<ConversionJobRepositoryInterface>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let savedJobs: unknown[];

  const command: RequestConversionCommand = { bookId: 42, targetFormat: 'MOBI' };

  beforeEach(async () => {
    savedJobs = [];
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestConversionUseCase,
        {
          provide: 'IBookFormatRepository',
          useValue: { getFormatInfo: jest.fn() },
        },
        {
          provide: 'IConversionJobRepository',
          useValue: {
            save: jest.fn((job: unknown) => void savedJobs.push(job)),
            findById: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: { emitAsync: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get(RequestConversionUseCase);
    bookFormatRepository = module.get(
      'IBookFormatRepository',
    ) as jest.Mocked<IBookFormatRepository>;
    conversionJobRepository = module.get(
      'IConversionJobRepository',
    ) as jest.Mocked<ConversionJobRepositoryInterface>;
    eventEmitter = module.get(EventEmitter2);
  });

  it('should create a pending job and emit a FormatConversionRequestedEvent', async () => {
    bookFormatRepository.getFormatInfo.mockResolvedValue({
      bookPath: 'Author/Book',
      fileName: 'Book',
      format: 'EPUB',
      size: 100,
    });

    const jobId = await useCase.execute(command);

    expect(jobId).toBeDefined();
    expect(conversionJobRepository.save).toHaveBeenCalledTimes(1);
    const saved = savedJobs[0] as {
      props: { id: string; bookId: number; sourceFormat: string; targetFormat: string; status: string };
    };
    expect(saved.props.id).toBe(jobId);
    expect(saved.props.bookId).toBe(42);
    expect(saved.props.sourceFormat).toBe('EPUB');
    expect(saved.props.targetFormat).toBe('MOBI');
    expect(saved.props.status).toBe('pending');

    expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
      'FormatConversionRequestedEvent',
      expect.any(FormatConversionRequestedEvent),
    );
    const event = eventEmitter.emitAsync.mock.calls[0][1] as FormatConversionRequestedEvent;
    expect(event.bookId).toBe(42);
    expect(event.sourceFormat).toBe('EPUB');
    expect(event.targetFormat).toBe('MOBI');
  });

  it('should throw NotFoundException when the book has no playable format', async () => {
    bookFormatRepository.getFormatInfo.mockResolvedValue(null);

    await expect(useCase.execute(command)).rejects.toThrow(NotFoundException);
    expect(conversionJobRepository.save).not.toHaveBeenCalled();
    expect(eventEmitter.emitAsync).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException for an unsupported target format', async () => {
    bookFormatRepository.getFormatInfo.mockResolvedValue({
      bookPath: 'Author/Book',
      fileName: 'Book',
      format: 'EPUB',
      size: 100,
    });

    await expect(
      useCase.execute({ bookId: 42, targetFormat: 'TXT' }),
    ).rejects.toThrow(BadRequestException);
    expect(conversionJobRepository.save).not.toHaveBeenCalled();
    expect(eventEmitter.emitAsync).not.toHaveBeenCalled();
  });
});