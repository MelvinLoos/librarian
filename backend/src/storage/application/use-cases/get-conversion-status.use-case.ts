import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConversionStatus } from '../../domain/conversion-status.enum';
import type { ConversionJobRepositoryInterface } from '../ports/conversion-job-repository.interface';

export interface GetConversionStatusQuery {
  jobId: string;
}

export interface ConversionStatusResult {
  jobId: string;
  status: ConversionStatus;
  progress: number;
  sourceFormat: string;
  targetFormat: string;
  errorMessage?: string;
  outputPath?: string;
  updatedAt: Date;
}

@Injectable()
export class GetConversionStatusUseCase {
  private readonly logger = new Logger(GetConversionStatusUseCase.name);

  constructor(
    @Inject('IConversionJobRepository')
    private readonly conversionJobRepository: ConversionJobRepositoryInterface,
  ) {}

  async execute(
    query: GetConversionStatusQuery,
  ): Promise<ConversionStatusResult | null> {
    const job = await this.conversionJobRepository.findById(query.jobId);

    if (!job) {
      this.logger.warn(`Conversion job ${query.jobId} not found`);
      return null;
    }

    return {
      jobId: job.props.id,
      status: job.props.status ?? ConversionStatus.PENDING,
      progress: job.props.progress ?? 0,
      sourceFormat: job.props.sourceFormat,
      targetFormat: job.props.targetFormat,
      errorMessage: job.props.errorMessage,
      outputPath: job.props.outputPath,
      updatedAt: job.props.updatedAt ?? new Date(),
    };
  }
}
