import { Book } from '../../domain/book.aggregate';

export interface FindAllBooksParams {
  sort?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  search?: string;
  tag?: string;
}

export interface IBookRepository {
  save(book: Book): Promise<void>;
  findById(id: string): Promise<Book | null>;
  findAll(params?: FindAllBooksParams): Promise<Book[]>;
}
