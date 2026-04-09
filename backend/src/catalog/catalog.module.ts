import { Module } from '@nestjs/common';
import { BookController } from './presentation/book.controller';
import { CreateBookUseCase } from './application/use-cases/create-book.use-case';
import { GetBookUseCase } from './application/use-cases/get-book.use-case';
import { Book } from './domain/book.aggregate';
import { IBookRepository } from './application/ports/book.repository.interface';

// In-memory implementation for Sprint 2 wiring
class InMemoryBookRepository implements IBookRepository {
  private books: Map<string, Book> = new Map();

  async save(book: Book): Promise<void> {
    this.books.set(book.id, book);
  }

  async findById(id: string): Promise<Book | null> {
    return this.books.get(id) || null;
  }

  async findAll(): Promise<Book[]> {
    return Array.from(this.books.values());
  }
}

@Module({
  controllers: [BookController],
  providers: [
    CreateBookUseCase,
    GetBookUseCase,
    {
      provide: 'IBookRepository',
      useClass: InMemoryBookRepository,
    },
  ],
  exports: [CreateBookUseCase, GetBookUseCase],
})
export class CatalogModule {}
