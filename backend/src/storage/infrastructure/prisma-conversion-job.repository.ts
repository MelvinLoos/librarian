import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { ConversionJob } from '../domain/conversion-job.entity';
import type { ConversionJobRepositoryInterface } from '../application/ports/conversion-job-repository.interface';

@Injectable()
export class PrismaConversionJobRepository
  implements ConversionJobRepositoryInterface
{
  private readonly logger = new Logger(PrismaConversionJobRepository.name);

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async save(job: ConversionJob): Promise<void> {
    throw new Error('Not implemented');
  }

  async findById(id: string): Promise<ConversionJob | null> {
    throw new Error('Not implemented');
  }
}