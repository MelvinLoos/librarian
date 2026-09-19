import { Test, TestingModule } from '@nestjs/testing';
import {
  GetConversionStatusUseCase,
  GetConversionStatusQuery,
} from './get-conversion-status.use-case';
import { ConversionJob } from '../../domain/conversion-job.entity';
import { ConversionStatus } from '../../domain/conversion-status.enum';
import type { ConversionJobRepositoryInterface } from '../ports/conversion-job-repository.interface';

describe('GetConversionStatusUseCase', () => {
  let useCase: GetConversionStatusUseCase;
  let conversionJobRepository: jest.Mocked<ConversionJobRepositoryInterface>;

  const query: GetConversionStatusQuery = { jobId: 'job-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetConversionStatusUseCase,
        {
          provide: 'IConversionJobRepository',
          useValue: { save: jest.fn(), findById: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get(GetConversionStatusUseCase);
    conversionJobRepository = module.get(
      'IConversionJobRepository',
    ) as jest.Mocked<ConversionJobRepositoryInterface>;
  });

  it('should map a conversion job into a status DTO', async () => {
    const job = new ConversionJob({
      id: 'job-1',
      bookId: 42,
      sourceFormat: 'EPUB',
      targetFormat: 'MOBI',
      status: ConversionStatus.RUNNING,
      progress: 50,
    });
    conversionJobRepository.findById.mockResolvedValue(job);

    const result = await useCase.execute(query);

    expect(conversionJobRepository.findById).toHaveBeenCalledWith('job-1');
    expect(result).not.toBeNull();
    expect(result!.jobId).toBe('job-1');
    expect(result!.status).toBe(ConversionStatus.RUNNING);
    expect(result!.progress).toBe(50);
    expect(result!.sourceFormat).toBe('EPUB');
    expect(result!.targetFormat).toBe('MOBI');
    expect(result!.updatedAt).toBeInstanceOf(Date);
  });

  it('should return null when the job does not exist', async () => {
    conversionJobRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute(query);

    expect(result).toBeNull();
  });
});