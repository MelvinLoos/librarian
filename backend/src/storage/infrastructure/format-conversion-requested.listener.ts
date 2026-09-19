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
    this.logger.log(
      `Handling conversion request job ${event.jobId} (${event.sourceFormat} -> ${event.targetFormat})`,
    );

    try {
      const info = await this.bookFormatRepository.getFormatInfo(
        event.bookId,
        event.sourceFormat,
      );
      if (!info) {
        this.logger.error(
          `Book ${event.bookId} format ${event.sourceFormat} not found; conversion ${event.jobId} aborted`,
        );
        return;
      }

      const sourceAbsolutePath = this.fileStorage.getBookFilePath(
        info.bookPath,
        info.fileName,
        info.format,
      );
      const outputRelativePath = `.librarian/conversions/${event.jobId}.${event.targetFormat.toLowerCase()}`;

      this.logger.log(
        `Resolved source ${sourceAbsolutePath}; output ${outputRelativePath}`,
      );

      await this.executeConversionJobUseCase.execute({
        jobId: event.jobId,
        sourceAbsolutePath,
        outputRelativePath,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Conversion request ${event.jobId} failed: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
