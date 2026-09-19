import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FormatConversionCompletedEvent } from '../../domain/events/format-conversion-completed.event';
import type { ConversionJobRepositoryInterface } from '../ports/conversion-job-repository.interface';
import type { IConversionExecutor } from '../ports/conversion-executor.interface';

export interface ExecuteConversionJobCommand {
  jobId: string;
  sourceAbsolutePath: string;
  outputRelativePath: string;
}

@Injectable()
export class ExecuteConversionJobUseCase {
  private readonly logger = new Logger(ExecuteConversionJobUseCase.name);

  constructor(
    @Inject('IConversionJobRepository')
    private readonly conversionJobRepository: ConversionJobRepositoryInterface,
    @Inject('IConversionExecutor')
    private readonly conversionExecutor: IConversionExecutor,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: ExecuteConversionJobCommand): Promise<void> {
    const { jobId, sourceAbsolutePath, outputRelativePath } = command;

    const job = await this.conversionJobRepository.findById(jobId);
    if (!job) {
      this.logger.warn(`Cannot execute missing conversion job ${jobId}`);
      throw new NotFoundException(`Conversion job ${jobId} not found`);
    }

    try {
      job.markRunning();
      await this.conversionJobRepository.save(job);

      await this.conversionExecutor.convert({
        jobId,
        sourceAbsolutePath,
        sourceFormat: job.props.sourceFormat,
        targetFormat: job.props.targetFormat,
        outputRelativePath,
      });

      job.markCompleted(outputRelativePath);
      await this.conversionJobRepository.save(job);

      await this.eventEmitter.emitAsync(
        'FormatConversionCompletedEvent',
        new FormatConversionCompletedEvent(
          jobId,
          true,
          job.props.sourceFormat,
          job.props.targetFormat,
          outputRelativePath,
        ),
      );
      this.logger.log(
        `Conversion job ${jobId} completed (${outputRelativePath})`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Conversion job ${jobId} failed: ${message}`,
        undefined,
      );

      try {
        job.markFailed(message);
        await this.conversionJobRepository.save(job);
      } catch {
        // Job is already in a terminal state; nothing else to persist.
      }

      await this.eventEmitter.emitAsync(
        'FormatConversionCompletedEvent',
        new FormatConversionCompletedEvent(
          jobId,
          false,
          job.props.sourceFormat,
          job.props.targetFormat,
          undefined,
          message,
        ),
      );

      throw error;
    }
  }
}
