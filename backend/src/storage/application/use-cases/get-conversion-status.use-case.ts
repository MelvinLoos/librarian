import { Inject, Injectable } from '@nestjs/common';
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
  constructor(
    @Inject('IConversionJobRepository')
    private readonly conversionJobRepository: ConversionJobRepositoryInterface,
  ) {}

  async execute(
    query: GetConversionStatusQuery,
  ): Promise<ConversionStatusResult | null> {
    throw new Error('Not implemented');
  }
}