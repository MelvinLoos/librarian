import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ExecuteConversionJobUseCase,
  ExecuteConversionJobCommand,
} from './execute-conversion-job.use-case';
import { ConversionJob } from '../../domain/conversion-job.entity';
import { ConversionStatus } from '../../domain/conversion-status.enum';
import { FormatConversionCompletedEvent } from '../../domain/events/format-conversion-completed.event';
import type { ConversionJobRepositoryInterface } from '../ports/conversion-job-repository.interface';
import type { IConversionExecutor } from '../ports/conversion-executor.interface';
import { NotFoundException } from '@nestjs/common';

describe('ExecuteConversionJobUseCase', () => {
  let useCase: ExecuteConversionJobUseCase;
  let conversionJobRepository: jest.Mocked<ConversionJobRepositoryInterface>;
  let conversionExecutor: jest.Mocked<IConversionExecutor>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let savedStates: string[];

  const command: ExecuteConversionJobCommand = {
    jobId: 'job-1',
    sourceAbsolutePath: '/tmp/main.epub',
    outputRelativePath: '.librarian/conversions/job-1.mobi',
  };

  const pendingJob = () =>
    new ConversionJob({
      id: 'job-1',
      bookId: 42,
      sourceFormat: 'EPUB',
      targetFormat: 'MOBI',
    });

  beforeEach(async () => {
    savedStates = [];
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecuteConversionJobUseCase,
        {
          provide: 'IConversionJobRepository',
          useValue: {
            save: jest.fn((job: ConversionJob) => {
              savedStates.push(job.props.status);
            }),
            findById: jest.fn(),
          },
        },
        {
          provide: 'IConversionExecutor',
          useValue: { convert: jest.fn() },
        },
        {
          provide: EventEmitter2,
          useValue: { emitAsync: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get(ExecuteConversionJobUseCase);
    conversionJobRepository = module.get('IConversionJobRepository');
    conversionExecutor = module.get('IConversionExecutor');
    eventEmitter = module.get(EventEmitter2);
  });

  it('should run the conversion, complete the job, and emit a success event', async () => {
    conversionJobRepository.findById.mockResolvedValue(pendingJob());

    await useCase.execute(command);

    expect(conversionExecutor.convert).toHaveBeenCalledWith({
      jobId: 'job-1',
      sourceAbsolutePath: '/tmp/main.epub',
      sourceFormat: 'EPUB',
      targetFormat: 'MOBI',
      outputRelativePath: '.librarian/conversions/job-1.mobi',
    });
    expect(savedStates).toEqual([
      ConversionStatus.RUNNING,
      ConversionStatus.COMPLETED,
    ]);

    expect(eventEmitter.emitAsync).toHaveBeenCalledTimes(1);
    const event = eventEmitter.emitAsync.mock
      .calls[0][1] as FormatConversionCompletedEvent;
    expect(event.jobId).toBe('job-1');
    expect(event.success).toBe(true);
    expect(event.outputPath).toBe('.librarian/conversions/job-1.mobi');
  });

  it('should mark the job as failed and emit a failure event when the executor throws', async () => {
    conversionJobRepository.findById.mockResolvedValue(pendingJob());
    conversionExecutor.convert.mockRejectedValue(
      new Error('Calibre ebook-convert CLI is not installed'),
    );

    await expect(useCase.execute(command)).rejects.toThrow(
      'Calibre ebook-convert CLI is not installed',
    );

    expect(savedStates).toEqual([
      ConversionStatus.RUNNING,
      ConversionStatus.FAILED,
    ]);
    expect(eventEmitter.emitAsync).toHaveBeenCalledTimes(1);
    const event = eventEmitter.emitAsync.mock
      .calls[0][1] as FormatConversionCompletedEvent;
    expect(event.success).toBe(false);
    expect(event.errorMessage).toBe(
      'Calibre ebook-convert CLI is not installed',
    );
  });

  it('should throw NotFoundException when the job does not exist', async () => {
    conversionJobRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(command)).rejects.toThrow(NotFoundException);
    expect(conversionExecutor.convert).not.toHaveBeenCalled();
    expect(eventEmitter.emitAsync).not.toHaveBeenCalled();
  });
});
