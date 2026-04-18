import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { Book } from '../../domain/book.aggregate';
import type { IBookRepository, FindAllBooksParams } from '../ports/book.repository.interface';

@Injectable()
export class GetBookUseCase {
  private readonly logger = new Logger(GetBookUseCase.name);

  constructor(
    @Inject('IBookRepository')
    private readonly bookRepository: IBookRepository
  ) {}

  async execute(id: string): Promise<Book> {
    const book = await this.bookRepository.findById(id);
    
    if (!book) {
      this.logger.warn(`Book not found for ID: ${id}`);
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    
    return book;
  }

  async executeAll(params?: FindAllBooksParams): Promise<Book[]> {
    this.logger.log(`Executing findAll books with params: ${JSON.stringify(params)}`);
    return this.bookRepository.findAll(params);
  }
}
