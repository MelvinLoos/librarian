import { Injectable, Inject, Logger } from '@nestjs/common';
import { IBookRepository, FindAllBooksParams } from '../application/ports/book.repository.interface';
import { Book } from '../domain/book.aggregate';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { LegacyAclMapper, PrismaBookWithAuthors } from './legacy-acl.mapper';

@Injectable()
export class PrismaBookRepository implements IBookRepository {
  private readonly logger = new Logger(PrismaBookRepository.name);

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) { }

  async findById(id: string): Promise<Book | null> {
    const bookId = parseInt(id, 10);
    const isLegacyId = !isNaN(bookId) && id === bookId.toString();
    if (!isLegacyId) {
      this.logger.debug(`Invalid legacy ID format requested: ${id}`);
      return null;
    }

    this.logger.debug(`Fetching book from database with ID: ${bookId}`);
    const raw = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: {
        authors: { include: { author: true } },
        series: { include: { series: true } },
        comments: true,
        formats: true,
      }
    });

    if (!raw) return null;
    return LegacyAclMapper.toDomain(raw as PrismaBookWithAuthors);
  }

  async findAll(params?: FindAllBooksParams): Promise<Book[]> {
    const { sort, order, limit, search, tag } = params || {};
    this.logger.debug(`Fetching books from database with params: ${JSON.stringify(params)}`);

    const raws = await this.prisma.book.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { title: { contains: search } },
              { authorSort: { contains: search } },
            ]
          } : {},
          tag ? {
            tags: { some: { tag: { name: tag } } }
          } : {}
        ]
      },
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
      this.logger.debug(`Creating new book record in database: ${persistence.title}`);
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
      this.logger.debug(`Updating existing book record in database ID: ${bookId}`);
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
