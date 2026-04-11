import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Book } from '../../domain/book.aggregate';
import type { IBookRepository, FindAllBooksParams } from '../ports/book.repository.interface';

@Injectable()
export class GetBookUseCase {
  constructor(
    @Inject('IBookRepository')
    private readonly bookRepository: IBookRepository
  ) {}

  async execute(id: string): Promise<Book> {
    const book = await this.bookRepository.findById(id);
    
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    
    return book;
  }

  async executeAll(params?: FindAllBooksParams): Promise<Book[]> {
    return this.bookRepository.findAll(params);
  }
}
