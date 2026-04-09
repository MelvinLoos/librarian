import { Book } from '../../domain/book.aggregate';

export interface IBookRepository {
  save(book: Book): Promise<void>;
  findById(id: string): Promise<Book | null>;
  findAll(): Promise<Book[]>;
}
