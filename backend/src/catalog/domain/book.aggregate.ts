import { AggregateRoot } from '../../shared/domain/aggregate-root';
import { Author } from './entities/author.entity';
import { Tag } from './entities/tag.entity';
import { Series } from './entities/series.entity';
import { CustomColumn } from './entities/custom-column.entity';
import { Shelf } from './entities/shelf.entity';
import { Rating } from './value-objects/rating.value-object';
import { Identifier } from './value-objects/identifier.value-object';
import { BookCreatedEvent } from './events/book-created.event';
import { BookUpdatedEvent } from './events/book-updated.event';

export interface BookFormat {
  format: string;
  uncompressedSize: number;
  name: string;
}

export interface BookProps {
  title: string;
  sortTitle?: string;
  timestamp?: Date;
  pubdate?: Date;
  hasCover?: boolean;
  authorSort?: string;
  description?: string;

  authors?: Author[];
  tags?: Tag[];
  series?: Series;
  customColumns?: CustomColumn[];
  shelves?: Shelf[];
  rating?: Rating;
  identifiers?: Identifier[];
  path?: string;
  formats?: BookFormat[];
  publisher?: string;
}

export interface BookUpdateProps {
  title?: string;
  sortTitle?: string;
  timestamp?: Date;
  pubdate?: Date;
  hasCover?: boolean;
  authorSort?: string;
  description?: string;
  authors?: Author[];
  tags?: Tag[];
  series?: Series;
  customColumns?: CustomColumn[];
  shelves?: Shelf[];
  rating?: number;
  identifiers?: Identifier[];
  path?: string;
  formats?: BookFormat[];
  publisher?: string;
}

export class Book extends AggregateRoot<BookProps> {
  private constructor(props: BookProps, id?: string) {
    super(
      {
        ...props,
        authors: props.authors ?? [],
        tags: props.tags ?? [],
        customColumns: props.customColumns ?? [],
        shelves: props.shelves ?? [],
        identifiers: props.identifiers ?? [],
        hasCover: props.hasCover ?? false,
        authorSort: props.authorSort ?? '',
        formats: props.formats ?? [],
        description: props.description,
      },
      id,
    );
  }

  public static create(props: BookProps, id?: string): Book {
    if (!props.title || props.title.trim() === '') {
      throw new Error('Book title cannot be empty');
    }

    const cleanProps = {
      ...props,
      title: props.title.trim(),
    };

    const book = new Book(cleanProps, id);

    if (!id) {
      book.addDomainEvent(new BookCreatedEvent(book.id, book.props.title));
    }

    return book;
  }

  public addAuthor(author: Author): void {
    if (!this.props.authors) this.props.authors = [];
    this.props.authors.push(author);
  }

  public addTag(tag: Tag): void {
    if (!this.props.tags) this.props.tags = [];
    this.props.tags.push(tag);
  }

  public setRating(rating: Rating): void {
    this.props.rating = rating;
  }

  public addIdentifier(identifier: Identifier): void {
    if (!this.props.identifiers) this.props.identifiers = [];
    this.props.identifiers.push(identifier);
  }

  public update(changes: BookUpdateProps): void {
    if (changes.title !== undefined) {
      if (!changes.title || changes.title.trim() === '') {
        throw new Error('Book title cannot be empty');
      }
      this.props.title = changes.title.trim();
    }

    if (changes.sortTitle !== undefined) {
      this.props.sortTitle = changes.sortTitle;
    }
    if (changes.timestamp !== undefined) {
      this.props.timestamp = changes.timestamp;
    }
    if (changes.pubdate !== undefined) {
      this.props.pubdate = changes.pubdate;
    }
    if (changes.hasCover !== undefined) {
      this.props.hasCover = changes.hasCover;
    }
    if (changes.authorSort !== undefined) {
      this.props.authorSort = changes.authorSort;
    }
    if (changes.description !== undefined) {
      this.props.description = changes.description;
    }
    if (changes.path !== undefined) {
      this.props.path = changes.path;
    }
    if (changes.formats !== undefined) {
      this.props.formats = changes.formats;
    }
    if (changes.publisher !== undefined) {
      this.props.publisher = changes.publisher;
    }

    if (changes.authors !== undefined) {
      this.props.authors = changes.authors;
    }
    if (changes.tags !== undefined) {
      this.props.tags = changes.tags;
    }
    if (changes.series !== undefined) {
      this.props.series = changes.series;
    }
    if (changes.customColumns !== undefined) {
      this.props.customColumns = changes.customColumns;
    }
    if (changes.shelves !== undefined) {
      this.props.shelves = changes.shelves;
    }
    if (changes.identifiers !== undefined) {
      this.props.identifiers = changes.identifiers;
    }

    if (changes.rating !== undefined) {
      this.props.rating = new Rating({ value: changes.rating });
    }

    this.addDomainEvent(new BookUpdatedEvent(this.id, this.props.title));
  }
}
