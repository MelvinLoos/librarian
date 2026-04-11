import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { ILegacyBookRepository } from '../application/ports/legacy-book-repository.interface';

@Injectable()
export class PrismaLegacyBookRepository implements ILegacyBookRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getBookPath(bookId: number): Promise<string | null> {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      select: { path: true },
    });
    return book?.path || null;
  }
}