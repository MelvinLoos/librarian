import { Author } from '../entities/author.entity';
import { Tag } from '../entities/tag.entity';
import { Series } from '../entities/series.entity';
import { Identifier } from './identifier.value-object';
import type { BookUpdateProps } from '../book.aggregate';

export interface RawBulkAuthor {
  name: string;
  sort?: string;
  link?: string;
}

export interface RawBulkTag {
  name: string;
}

export interface RawBulkSeries {
  name: string;
  index?: number;
}

export interface RawBulkIdentifier {
  type: string;
  value: string;
}

export interface RawBulkChanges {
  title?: string;
  authorSort?: string;
  description?: string;
  publisher?: string;
  rating?: number;
  authors?: RawBulkAuthor[];
  tags?: RawBulkTag[];
  series?: RawBulkSeries;
  identifiers?: RawBulkIdentifier[];
}

/**
 * BulkUpdateCommand
 *
 * Value Object describing a batch metadata change applied to a set of books.
 * Pure TS — zero external dependencies.
 */
export class BulkUpdateCommand {
  constructor(
    public readonly bookIds: number[],
    public readonly changes: BookUpdateProps,
  ) {
    if (!bookIds || bookIds.length === 0) {
      throw new Error('BulkUpdateCommand requires at least one book id');
    }
    if (bookIds.some((id) => !Number.isInteger(id) || id < 1)) {
      throw new Error('BulkUpdateCommand book ids must be positive integers');
    }
    if (
      changes.title !== undefined &&
      (!changes.title || changes.title.trim() === '')
    ) {
      throw new Error('BulkUpdateCommand title cannot be empty');
    }
  }

  static fromRaw(bookIds: number[], raw: RawBulkChanges): BulkUpdateCommand {
    const changes: BookUpdateProps = {
      title: raw.title,
      authorSort: raw.authorSort,
      description: raw.description,
      publisher: raw.publisher,
      rating: raw.rating,
      authors: raw.authors?.map((author) => new Author(author)),
      tags: raw.tags?.map((tag) => new Tag(tag)),
      series: raw.series
        ? new Series({ name: raw.series.name, index: raw.series.index })
        : undefined,
      identifiers: raw.identifiers?.map(
        (identifier) =>
          new Identifier({ type: identifier.type, value: identifier.value }),
      ),
    };

    return new BulkUpdateCommand(bookIds, changes);
  }
}
