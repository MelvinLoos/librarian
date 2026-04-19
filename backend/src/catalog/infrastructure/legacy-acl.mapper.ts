import { Book as PrismaBook, Author as PrismaAuthor, BookAuthorLink } from '@prisma/client';
import { Book } from '../domain/book.aggregate';
import { Author } from '../domain/entities/author.entity';

export type PrismaBookWithAuthors = PrismaBook & {
  authors: (BookAuthorLink & {
    author: PrismaAuthor;
  })[];
  formats?: any[];
  comments?: any[];
  series?: any[];
  tags?: any[];
};

export class LegacyAclMapper {
  static toDomain(raw: PrismaBookWithAuthors): Book {
    const authors = raw.authors.map((link) => {
      return new Author(
        {
          name: link.author.name,
          sort: link.author.sort || undefined,
          link: link.author.link || undefined,
        },
        link.author.id.toString(),
      );
    });

    const mappedFormats = raw.formats?.map(f => ({
      format: f.format,
      uncompressedSize: f.uncompressedSize,
      name: f.name
    })) || [];

    const description = raw.comments?.[0]?.text || undefined;
    const seriesName = raw.series?.[0]?.series?.name || undefined;
    
    // We can map tags as simple strings for the frontend
    const mappedTags = raw.tags?.map(t => t.tag.name) || [];

    return Book.create(
      {
        title: raw.title,
        sortTitle: raw.sort || undefined,
        timestamp: raw.timestamp || undefined,
        pubdate: raw.pubdate || undefined,
        hasCover: raw.hasCover || false,
        authorSort: raw.authorSort || undefined,
        description: description,
        // @ts-ignore - bypassing full entity creation for UI speed
        series: seriesName,
        // @ts-ignore
        tags: mappedTags,
        authors,
        formats: mappedFormats,
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
    };
  }
}
