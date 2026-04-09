import { AggregateRoot } from '../../shared/domain/aggregate-root';
import { Author } from './entities/author.entity';
import { Tag } from './entities/tag.entity';
import { Series } from './entities/series.entity';
import { CustomColumn } from './entities/custom-column.entity';
import { Shelf } from './entities/shelf.entity';
import { Rating } from './value-objects/rating.value-object';
import { Identifier } from './value-objects/identifier.value-object';
import { BookCreatedEvent } from './events/book-created.event';

export interface BookProps {
  title: string;
  sortTitle?: string;
  timestamp?: Date;
  pubdate?: Date;
  hasCover?: boolean;
  authorSort?: string;
  
  authors?: Author[];
  tags?: Tag[];
  series?: Series;
  customColumns?: CustomColumn[];
  shelves?: Shelf[];
  rating?: Rating;
  identifiers?: Identifier[];
}

export class Book extends AggregateRoot<BookProps> {
  private constructor(props: BookProps, id?: string) {
    super({
      ...props,
      authors: props.authors ?? [],
      tags: props.tags ?? [],
      customColumns: props.customColumns ?? [],
      shelves: props.shelves ?? [],
      identifiers: props.identifiers ?? [],
      hasCover: props.hasCover ?? false,
      authorSort: props.authorSort ?? '',
    }, id);
  }

  public static create(props: BookProps, id?: string): Book {
    if (!props.title || props.title.trim() === '') {
      throw new Error('Book title cannot be empty');
    }

    const cleanProps = {
      ...props,
      title: props.title.trim()
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
}
