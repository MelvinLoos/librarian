import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { ISeriesRepository } from '../application/ports/series.repository.interface';

@Injectable()
export class PrismaSeriesRepository implements ISeriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const series = await this.prisma.series.findMany({
      orderBy: { name: 'asc' },
    });
    return series as any; // Map to Domain Entity if strictly using Mappers
  }
}