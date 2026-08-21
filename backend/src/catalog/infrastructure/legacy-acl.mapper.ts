import {
  Book as PrismaBook,
  Author as PrismaAuthor,
  BookAuthorLink,
  Tag as PrismaTag,
  BookTagLink,
  Series as PrismaSeries,
  BookSeriesLink,
  Publisher as PrismaPublisher,
  BooksPublisherLink,
  Rating as PrismaRatingModel,
  BooksRatingLink,
  Identifier as PrismaIdentifier,
} from '@prisma/client';
import { Book } from '../domain/book.aggregate';
import { Author } from '../domain/entities/author.entity';
import { Tag } from '../domain/entities/tag.entity';
import { Series } from '../domain/entities/series.entity';
import { Rating } from '../domain/value-objects/rating.value-object';
import { Identifier } from '../domain/value-objects/identifier.value-object';

type AuthorLink = BookAuthorLink & { author: PrismaAuthor };
type TagLink = BookTagLink & { tag: PrismaTag };
type SeriesLink = BookSeriesLink & { series: PrismaSeries };
type PublisherLink = BooksPublisherLink & { publisher: PrismaPublisher };
type RatingLink = BooksRatingLink & { rating: PrismaRatingModel };

export type PrismaBookWithRelations = PrismaBook & {
  authors: AuthorLink[];
  tags?: TagLink[];
  series?: SeriesLink[];
  publishers?: PublisherLink[];
  ratings?: RatingLink[];
  identifiers?: PrismaIdentifier[];
  formats?: Array<{
    format: string;
    uncompressedSize: number;
    name: string;
  }>;
  comments?: Array<{ text: string }>;
};

export type PrismaBookWithAuthors = PrismaBookWithRelations;

export class LegacyAclMapper {
  static toDomain(raw: PrismaBookWithRelations): Book {
    const authors = raw.authors.map((link) => {
      return new Author(
        {
          name: link.author.name,
          sort: link.author.sort ?? undefined,
          link: link.author.link ?? undefined,
        },
        link.author.id.toString(),
      );
    });

    const mappedTags =
      raw.tags?.map(
        (link) => new Tag({ name: link.tag.name }, link.tag.id.toString()),
      ) ?? [];

    const mappedFormats =
      raw.formats?.map((f) => ({
        format: f.format,
        uncompressedSize: f.uncompressedSize,
        name: f.name,
      })) ?? [];

    const description = raw.comments?.[0]?.text ?? undefined;

    const seriesLink = raw.series?.[0];
    const series = seriesLink
      ? new Series(
          {
            name: seriesLink.series.name,
            index: raw.seriesIndex ?? 1,
          },
          seriesLink.series.id.toString(),
        )
      : undefined;

    const publisher = raw.publishers?.[0]?.publisher?.name ?? undefined;

    const ratingLink = raw.ratings?.[0];
    // Calibre stores ratings as an integer on a 0-10 scale (half-star steps).
    // The domain Rating value object uses a 0-5 scale.
    const rating = ratingLink
      ? new Rating({ value: ratingLink.rating.rating / 2 })
      : undefined;

    const identifiers =
      raw.identifiers?.map(
        (i) => new Identifier({ type: i.type, value: i.val }),
      ) ?? [];

    return Book.create(
      {
        title: raw.title,
        sortTitle: raw.sort ?? undefined,
        timestamp: raw.timestamp ?? undefined,
        pubdate: raw.pubdate ?? undefined,
        hasCover: raw.hasCover ?? false,
        authorSort: raw.authorSort ?? undefined,
        description,
        series,
        tags: mappedTags,
        authors,
        formats: mappedFormats,
        publisher,
        rating,
        identifiers,
      },
      raw.id.toString(),
    );
  }

  static toPersistence(book: Book): Partial<PrismaBook> {
    return {
      title: book.props.title,
      sort: book.props.sortTitle,
      timestamp: book.props.timestamp,
      pubdate: book.props.pubdate,
      hasCover: book.props.hasCover,
      authorSort: book.props.authorSort,
      seriesIndex: book.props.series?.props.index ?? 1,
    };
  }
}
