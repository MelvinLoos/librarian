import { Test, TestingModule } from '@nestjs/testing';
import {
  CancelConversionUseCase,
  CancelConversionCommand,
} from './cancel-conversion.use-case';
import { ConversionJob } from '../../domain/conversion-job.entity';
import { ConversionStatus } from '../../domain/conversion-status.enum';
import type { ConversionJobRepositoryInterface } from '../ports/conversion-job-repository.interface';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CancelConversionUseCase', () => {
  let useCase: CancelConversionUseCase;
  let conversionJobRepository: jest.Mocked<ConversionJobRepositoryInterface>;

  const command: CancelConversionCommand = { jobId: 'job-1' };

  const pendingJob = () =>
    new ConversionJob({
      id: 'job-1',
      bookId: 42,
      sourceFormat: 'EPUB',
      targetFormat: 'MOBI',
    });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelConversionUseCase,
        {
          provide: 'IConversionJobRepository',
          useValue: { save: jest.fn(), findById: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get(CancelConversionUseCase);
    conversionJobRepository = module.get('IConversionJobRepository');
  });

  it('should cancel a pending job and persist it', async () => {
    conversionJobRepository.findById.mockResolvedValue(pendingJob());

    const job = await useCase.execute(command);

    expect(job.props.status).toBe(ConversionStatus.CANCELLED);
    expect(conversionJobRepository.save).toHaveBeenCalledWith(job);
  });

  it('should throw NotFoundException when the job does not exist', async () => {
    conversionJobRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(command)).rejects.toThrow(NotFoundException);
    expect(conversionJobRepository.save).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when the job is already completed', async () => {
    conversionJobRepository.findById.mockResolvedValue(
      new ConversionJob({
        id: 'job-1',
        bookId: 42,
        sourceFormat: 'EPUB',
        targetFormat: 'MOBI',
        status: ConversionStatus.COMPLETED,
      }),
    );

    await expect(useCase.execute(command)).rejects.toThrow(BadRequestException);
    expect(conversionJobRepository.save).not.toHaveBeenCalled();
  });
});
