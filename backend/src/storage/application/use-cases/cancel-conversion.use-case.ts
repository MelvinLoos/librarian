import { Inject, Injectable, Logger } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConversionJob } from '../../domain/conversion-job.entity';
import type { ConversionJobRepositoryInterface } from '../ports/conversion-job-repository.interface';

export interface CancelConversionCommand {
  jobId: string;
}

@Injectable()
export class CancelConversionUseCase {
  private readonly logger = new Logger(CancelConversionUseCase.name);

  constructor(
    @Inject('IConversionJobRepository')
    private readonly conversionJobRepository: ConversionJobRepositoryInterface,
  ) {}

  async execute(command: CancelConversionCommand): Promise<ConversionJob> {
    const job = await this.conversionJobRepository.findById(command.jobId);

    if (!job) {
      this.logger.warn(
        `Cannot cancel conversion job ${command.jobId}: not found`,
      );
      throw new NotFoundException(`Conversion job ${command.jobId} not found`);
    }

    try {
      job.cancel();
    } catch {
      this.logger.warn(
        `Cannot cancel conversion job ${command.jobId}: illegal state ${job.props.status}`,
      );
      throw new BadRequestException(
        'Conversion cannot be cancelled in its current state',
      );
    }

    await this.conversionJobRepository.save(job);
    this.logger.log(`Cancelled conversion job ${command.jobId}`);

    return job;
  }
}
