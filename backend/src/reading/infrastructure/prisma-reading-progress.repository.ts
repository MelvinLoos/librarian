import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { IReadingProgressRepository } from '../application/ports/reading-progress.repository.interface';

@Injectable()
export class PrismaReadingProgressRepository implements IReadingProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertProgress(userId: string, bookId: number, currentPage: number, totalPages: number): Promise<void> {
    await this.prisma.librarianReadingProgress.upsert({
      where: {
        userId_bookId: { userId, bookId }, // Uses the unique constraint
      },
      update: { currentPage, totalPages },
      create: { userId, bookId, currentPage, totalPages },
    });
  }

  async getUserReadingStates(userId: string): Promise<any[]> {
    return this.prisma.librarianReadingProgress.findMany({
      where: { userId },
      include: { book: true }, // Pulls in legacy metadata for the UI card
      orderBy: { updatedAt: 'desc' },
    });
  }
}