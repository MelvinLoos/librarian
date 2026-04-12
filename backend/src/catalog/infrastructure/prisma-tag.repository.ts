import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { ITagRepository } from '../application/ports/tag.repository.interface';

@Injectable()
export class PrismaTagRepository implements ITagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getTopTags(limit: number): Promise<{ id: number; name: string; count: number }[]> {
    const tags = await this.prisma.tag.findMany({
      take: limit,
      include: {
        _count: {
          select: { books: true },
        },
      },
      orderBy: {
        books: { _count: 'desc' },
      },
    });

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      count: tag._count.books,
    }));
  }
}