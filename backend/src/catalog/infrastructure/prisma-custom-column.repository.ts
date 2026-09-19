import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { CustomColumn } from '../domain/entities/custom-column.entity';
import type { CustomColumnRepositoryInterface } from '../application/ports/custom-column.repository.interface';

@Injectable()
export class PrismaCustomColumnRepository
  implements CustomColumnRepositoryInterface
{
  private readonly logger = new Logger(PrismaCustomColumnRepository.name);

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async findAll(): Promise<CustomColumn[]> {
    throw new Error('Not implemented');
  }

  async upsert(column: CustomColumn): Promise<CustomColumn> {
    throw new Error('Not implemented');
  }

  async deleteById(id: string): Promise<boolean> {
    throw new Error('Not implemented');
  }
}