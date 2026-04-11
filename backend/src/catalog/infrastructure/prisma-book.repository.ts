import { Injectable, Inject } from '@nestjs/common';
import { IBookRepository, FindAllBooksParams } from '../application/ports/book.repository.interface';
import { Book } from '../domain/book.aggregate';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { LegacyAclMapper, PrismaBookWithAuthors } from './legacy-acl.mapper';

@Injectable()
export class PrismaBookRepository implements IBookRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}

  async findById(id: string): Promise<Book | null> {
    const bookId = parseInt(id, 10);
    const isLegacyId = !isNaN(bookId) && id === bookId.toString();
    if (!isLegacyId) return null;

    const raw = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: {
        authors: { include: { author: true } },
        series: { include: { series: true } }, 
        comments: true,
      }
    });

    if (!raw) return null;
    return LegacyAclMapper.toDomain(raw as PrismaBookWithAuthors);
  }

  async findAll(params?: FindAllBooksParams): Promise<Book[]> {
    const { sort, order, limit } = params || {};

    const raws = await this.prisma.book.findMany({
      take: limit ? Number(limit) : undefined,
      orderBy: sort ? { [sort]: order || 'desc' } : undefined,
      include: {
        authors: { include: { author: true } },
        tags: { include: { tag: true } },
      },
    });

    return raws.map(raw => LegacyAclMapper.toDomain(raw as PrismaBookWithAuthors));
  }

  async save(book: Book): Promise<void> {
    const persistence = LegacyAclMapper.toPersistence(book);
    
    // Check if ID is a legacy integer ID
    const bookId = parseInt(book.id, 10);
    const isLegacyId = !isNaN(bookId) && book.id === bookId.toString();

    if (!isLegacyId) {
      // Create - Calibre tables use Int IDs, so we let it autoincrement
      await this.prisma.book.create({
        data: {
          title: persistence.title ?? 'Unknown',
          sort: persistence.sort,
          timestamp: persistence.timestamp,
          pubdate: persistence.pubdate,
          hasCover: persistence.hasCover,
          authorSort: persistence.authorSort,
        }
      });
    } else {
      // Update
      await this.prisma.book.update({
        where: { id: bookId },
        data: {
          title: persistence.title,
          sort: persistence.sort,
          timestamp: persistence.timestamp,
          pubdate: persistence.pubdate,
          hasCover: persistence.hasCover,
          authorSort: persistence.authorSort,
        }
      });
    }
  }
}
