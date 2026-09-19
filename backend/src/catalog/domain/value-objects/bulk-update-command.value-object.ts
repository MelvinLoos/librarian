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
    throw new Error('Not implemented');
  }

  static fromRaw(bookIds: number[], raw: RawBulkChanges): BulkUpdateCommand {
    throw new Error('Not implemented');
  }
}