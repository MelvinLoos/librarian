import { Inject, Injectable, Logger } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { ConversionJob } from '../../domain/conversion-job.entity';
import { FormatRegistry } from '../../domain/services/format-registry';
import { FormatConversionRequestedEvent } from '../../domain/events/format-conversion-requested.event';
import type { IBookFormatRepository } from '../ports/book-format-repository.interface';
import type { ConversionJobRepositoryInterface } from '../ports/conversion-job-repository.interface';

export interface RequestConversionCommand {
  bookId: number;
  targetFormat: string;
}

@Injectable()
export class RequestConversionUseCase {
  private readonly logger = new Logger(RequestConversionUseCase.name);

  constructor(
    @Inject('IBookFormatRepository')
    private readonly bookFormatRepository: IBookFormatRepository,
    @Inject('IConversionJobRepository')
    private readonly conversionJobRepository: ConversionJobRepositoryInterface,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: RequestConversionCommand): Promise<string> {
    const { bookId, targetFormat } = command;

    const info = await this.bookFormatRepository.getFormatInfo(
      bookId,
      undefined,
    );
    if (!info) {
      this.logger.warn(
        `Conversion requested for non-existent book ID: ${bookId}`,
      );
      throw new NotFoundException(`Book with ID ${bookId} not found`);
    }

    const source = info.format.trim().toUpperCase();
    const target = targetFormat.trim().toUpperCase();

    if (!FormatRegistry.supports(source, target)) {
      this.logger.warn(
        `Unsupported conversion requested: ${source} -> ${target}`,
      );
      throw new BadRequestException(
        `Conversion from ${source} to ${target} is not supported`,
      );
    }

    const jobId = randomUUID();
    const job = new ConversionJob({
      id: jobId,
      bookId,
      sourceFormat: source,
      targetFormat: target,
    });

    await this.conversionJobRepository.save(job);

    await this.eventEmitter.emitAsync(
      'FormatConversionRequestedEvent',
      new FormatConversionRequestedEvent(jobId, bookId, source, target),
    );

    this.logger.log(
      `Requested ${source} -> ${target} conversion for book ${bookId} (job ${jobId})`,
    );

    return jobId;
  }
}
