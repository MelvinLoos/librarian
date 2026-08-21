import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IBookRepository,
  FindAllBooksParams,
} from '../application/ports/book.repository.interface';
import { Book } from '../domain/book.aggregate';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { LegacyAclMapper, PrismaBookWithRelations } from './legacy-acl.mapper';

@Injectable()
export class PrismaBookRepository implements IBookRepository {
  private readonly logger = new Logger(PrismaBookRepository.name);

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

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
        tags: { include: { tag: true } },
        publishers: { include: { publisher: true } },
        ratings: { include: { rating: true } },
        identifiers: true,
      },
    });

    if (!raw) return null;
    return LegacyAclMapper.toDomain(raw as PrismaBookWithRelations);
  }

  async findAll(params?: FindAllBooksParams): Promise<Book[]> {
    const { sort, order, limit, search, tag } = params || {};
    this.logger.debug(
      `Fetching books from database with params: ${JSON.stringify(params)}`,
    );

    const raws = await this.prisma.book.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { title: { contains: search } },
                  { authorSort: { contains: search } },
                ],
              }
            : {},
          tag
            ? {
                tags: { some: { tag: { name: tag } } },
              }
            : {},
        ],
      },
      take: limit ? Number(limit) : undefined,
      orderBy: sort ? { [sort]: order || 'desc' } : undefined,
      include: {
        authors: { include: { author: true } },
        tags: { include: { tag: true } },
        publishers: { include: { publisher: true } },
        ratings: { include: { rating: true } },
        identifiers: true,
      },
    });

    return raws.map((raw) =>
      LegacyAclMapper.toDomain(raw as PrismaBookWithRelations),
    );
  }

  async save(book: Book): Promise<void> {
    const persistence = LegacyAclMapper.toPersistence(book);

    const bookId = parseInt(book.id, 10);
    const isLegacyId = !isNaN(bookId) && book.id === bookId.toString();

    if (!isLegacyId) {
      this.logger.debug(
        `Creating new book record in database: ${persistence.title}`,
      );
      await this.prisma.book.create({
        data: {
          title: persistence.title ?? 'Unknown',
          sort: persistence.sort ?? null,
          timestamp: persistence.timestamp ?? null,
          pubdate: persistence.pubdate ?? null,
          hasCover: persistence.hasCover ?? false,
          authorSort: persistence.authorSort ?? null,
          seriesIndex: persistence.seriesIndex ?? 1,
          path: null,
        },
      });
    } else {
      this.logger.debug(
        `Updating existing book record in database ID: ${bookId}`,
      );
      await this.prisma.book.update({
        where: { id: bookId },
        data: {
          title: persistence.title,
          sort: persistence.sort,
          timestamp: persistence.timestamp,
          pubdate: persistence.pubdate,
          hasCover: persistence.hasCover,
          authorSort: persistence.authorSort,
          seriesIndex: persistence.seriesIndex ?? 1,
        },
      });
    }
  }

  async update(book: Book): Promise<Book> {
    const bookId = parseInt(book.id, 10);
    const isLegacyId = !isNaN(bookId) && book.id === bookId.toString();

    if (!isLegacyId) {
      throw new Error(`Cannot update book with non-legacy ID: ${book.id}`);
    }

    const persistence = LegacyAclMapper.toPersistence(book);

    await this.prisma.$transaction(async (tx) => {
      await tx.book.update({
        where: { id: bookId },
        data: {
          title: persistence.title,
          sort: persistence.sort ?? null,
          timestamp: persistence.timestamp ?? null,
          pubdate: persistence.pubdate ?? null,
          hasCover: persistence.hasCover ?? false,
          authorSort: persistence.authorSort ?? null,
          seriesIndex: persistence.seriesIndex ?? 1,
        },
      });

      // Authors (books_authors_link)
      await tx.bookAuthorLink.deleteMany({ where: { bookId } });
      for (const author of book.props.authors ?? []) {
        const existing = await tx.author.findFirst({
          where: { name: author.props.name },
        });
        const authorId =
          existing?.id ??
          (
            await tx.author.create({
              data: {
                name: author.props.name,
                sort: author.props.sort ?? null,
                link: author.props.link ?? null,
              },
            })
          ).id;
        await tx.bookAuthorLink.create({
          data: { bookId, authorId },
        });
      }

      // Tags (books_tags_link)
      await tx.bookTagLink.deleteMany({ where: { bookId } });
      for (const tag of book.props.tags ?? []) {
        const existing = await tx.tag.findFirst({
          where: { name: tag.props.name },
        });
        const tagId =
          existing?.id ??
          (await tx.tag.create({ data: { name: tag.props.name } })).id;
        await tx.bookTagLink.create({ data: { bookId, tagId } });
      }

      // Series (books_series_link)
      await tx.bookSeriesLink.deleteMany({ where: { bookId } });
      if (book.props.series) {
        const existing = await tx.series.findFirst({
          where: { name: book.props.series.props.name },
        });
        const seriesId =
          existing?.id ??
          (
            await tx.series.create({
              data: {
                name: book.props.series.props.name,
                sort: null,
              },
            })
          ).id;
        await tx.bookSeriesLink.create({ data: { bookId, seriesId } });
      }

      // Publisher (books_publishers_link)
      await tx.booksPublisherLink.deleteMany({ where: { bookId } });
      if (book.props.publisher) {
        const existing = await tx.publisher.findFirst({
          where: { name: book.props.publisher },
        });
        const publisherId =
          existing?.id ??
          (
            await tx.publisher.create({
              data: { name: book.props.publisher },
            })
          ).id;
        await tx.booksPublisherLink.create({
          data: { bookId, publisherId },
        });
      }

      // Rating (books_ratings_link) — Calibre scale is 0-10, domain is 0-5.
      await tx.booksRatingLink.deleteMany({ where: { bookId } });
      if (book.props.rating) {
        const calibreRating = Math.round(book.props.rating.props.value * 2);
        const existing = await tx.rating.findFirst({
          where: { rating: calibreRating },
        });
        const ratingId =
          existing?.id ??
          (await tx.rating.create({ data: { rating: calibreRating } })).id;
        await tx.booksRatingLink.create({ data: { bookId, ratingId } });
      }

      // Identifiers (identifiers) — UNIQUE(book, type)
      await tx.identifier.deleteMany({ where: { bookId } });
      for (const identifier of book.props.identifiers ?? []) {
        await tx.identifier.create({
          data: {
            bookId,
            type: identifier.props.type,
            val: identifier.props.value,
          },
        });
      }

      // Description (comments)
      await tx.comment.deleteMany({ where: { bookId } });
      if (book.props.description) {
        await tx.comment.create({
          data: { bookId, text: book.props.description },
        });
      }
    });

    return findByIdSafe(this.prisma, bookId, this.logger);
  }
}

async function findByIdSafe(
  prisma: PrismaService,
  bookId: number,
  logger: Logger,
): Promise<Book> {
  const raw = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      authors: { include: { author: true } },
      series: { include: { series: true } },
      comments: true,
      formats: true,
      tags: { include: { tag: true } },
      publishers: { include: { publisher: true } },
      ratings: { include: { rating: true } },
      identifiers: true,
    },
  });

  if (!raw) {
    logger.error(`Failed to re-hydrate book after update: ${bookId}`);
    throw new Error(
      `Book with ID ${bookId} could not be re-hydrated after update`,
    );
  }

  return LegacyAclMapper.toDomain(raw as PrismaBookWithRelations);
}
