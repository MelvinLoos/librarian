import { Inject, Injectable } from '@nestjs/common';
import { ConversionJob } from '../../domain/conversion-job.entity';
import type { ConversionJobRepositoryInterface } from '../ports/conversion-job-repository.interface';

export interface CancelConversionCommand {
  jobId: string;
}

@Injectable()
export class CancelConversionUseCase {
  constructor(
    @Inject('IConversionJobRepository')
    private readonly conversionJobRepository: ConversionJobRepositoryInterface,
  ) {}

  async execute(command: CancelConversionCommand): Promise<ConversionJob> {
    throw new Error('Not implemented');
  }
}