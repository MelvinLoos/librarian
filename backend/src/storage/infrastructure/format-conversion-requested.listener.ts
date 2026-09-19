import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FormatConversionRequestedEvent } from '../domain/events/format-conversion-requested.event';
import { ExecuteConversionJobUseCase } from '../application/use-cases/execute-conversion-job.use-case';
import type { IBookFormatRepository } from '../application/ports/book-format-repository.interface';
import type { IFileStorage } from '../application/ports/file-storage.interface';

@Injectable()
export class FormatConversionRequestedListener {
  private readonly logger = new Logger(FormatConversionRequestedListener.name);

  constructor(
    private readonly executeConversionJobUseCase: ExecuteConversionJobUseCase,
    @Inject('IBookFormatRepository')
    private readonly bookFormatRepository: IBookFormatRepository,
    @Inject('IFileStorage')
    private readonly fileStorage: IFileStorage,
  ) {}

  @OnEvent('FormatConversionRequestedEvent')
  async handle(event: FormatConversionRequestedEvent): Promise<void> {
    throw new Error('Not implemented');
  }
}