import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { ConversionJob } from '../domain/conversion-job.entity';
import { ConversionStatus } from '../domain/conversion-status.enum';
import type { ConversionJobRepositoryInterface } from '../application/ports/conversion-job-repository.interface';

@Injectable()
export class PrismaConversionJobRepository implements ConversionJobRepositoryInterface {
  private readonly logger = new Logger(PrismaConversionJobRepository.name);

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async save(job: ConversionJob): Promise<void> {
    // Upsert by job id: replace any prior snapshot so findById always
    // resolves the most recent state transition.
    await this.prisma.librarianConversionJob.deleteMany({
      where: { id: job.props.id },
    });
    await this.prisma.librarianConversionJob.create({
      data: {
        id: job.props.id,
        bookId: job.props.bookId,
        sourceFormat: job.props.sourceFormat,
        targetFormat: job.props.targetFormat,
        status: job.props.status,
        progress: job.props.progress,
        errorMessage: job.props.errorMessage,
        outputPath: job.props.outputPath,
        requestedAt: job.props.requestedAt,
        updatedAt: job.props.updatedAt,
      },
    });
    this.logger.debug(`Persisted conversion job ${job.props.id}`);
  }

  async findById(id: string): Promise<ConversionJob | null> {
    const row = await this.prisma.librarianConversionJob.findUnique({
      where: { id },
    });
    if (!row) return null;

    return new ConversionJob({
      id: row.id,
      bookId: row.bookId,
      sourceFormat: row.sourceFormat,
      targetFormat: row.targetFormat,
      status: row.status as ConversionStatus,
      progress: row.progress,
      errorMessage: row.errorMessage ?? undefined,
      outputPath: row.outputPath ?? undefined,
      requestedAt: row.requestedAt,
      updatedAt: row.updatedAt,
    });
  }
}
