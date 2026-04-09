import { Book } from './book.aggregate';
import { Author } from './entities/author.entity';
import { Tag } from './entities/tag.entity';
import { Rating } from './value-objects/rating.value-object';
import { Identifier } from './value-objects/identifier.value-object';
import { BookCreatedEvent } from './events/book-created.event';

describe('Book Aggregate Root', () => {
  it('should create a valid book with just a title and generate an event', () => {
    const book = Book.create({ title: 'The Hobbit' });
    
    expect(book.props.title).toBe('The Hobbit');
    expect(book.id).toBeDefined();
    
    const events = book.domainEvents;
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(BookCreatedEvent);
    expect((events[0] as BookCreatedEvent).bookId).toBe(book.id);
  });

  it('should throw an error if title is empty', () => {
    expect(() => Book.create({ title: '   ' })).toThrow('Book title cannot be empty');
  });

  it('should allow adding an author', () => {
    const book = Book.create({ title: 'The Hobbit' });
    const author = new Author({ name: 'J.R.R. Tolkien' });
    
    book.addAuthor(author);
    
    expect(book.props.authors).toHaveLength(1);
    expect(book.props.authors![0].props.name).toBe('J.R.R. Tolkien');
  });

  it('should allow adding a tag', () => {
    const book = Book.create({ title: 'The Hobbit' });
    const tag = new Tag({ name: 'Fantasy' });
    
    book.addTag(tag);
    
    expect(book.props.tags).toHaveLength(1);
    expect(book.props.tags![0].props.name).toBe('Fantasy');
  });

  it('should allow setting a rating', () => {
    const book = Book.create({ title: 'The Hobbit' });
    const rating = new Rating({ value: 4.5 });
    
    book.setRating(rating);
    
    expect(book.props.rating).toBeDefined();
    expect(book.props.rating!.props.value).toBe(4.5);
  });

  it('should allow adding an identifier', () => {
    const book = Book.create({ title: 'The Hobbit' });
    const isbn = new Identifier({ type: 'isbn', value: '123456789' });
    
    book.addIdentifier(isbn);
    
    expect(book.props.identifiers).toHaveLength(1);
    expect(book.props.identifiers![0].props.value).toBe('123456789');
  });

  it('should allow initializing with full properties', () => {
    const author = new Author({ name: 'J.R.R. Tolkien' });
    const tag = new Tag({ name: 'Fantasy' });

    const book = Book.create({
      title: 'The Hobbit',
      authors: [author],
      tags: [tag],
      hasCover: true,
      timestamp: new Date('2023-01-01'),
      pubdate: new Date('1937-09-21'),
    });

    expect(book.props.title).toBe('The Hobbit');
    expect(book.props.authors).toHaveLength(1);
    expect(book.props.tags).toHaveLength(1);
    expect(book.props.hasCover).toBe(true);
    expect(book.props.timestamp).toEqual(new Date('2023-01-01'));
    // Ensure event is created
    expect(book.domainEvents).toHaveLength(1);
  });
});
