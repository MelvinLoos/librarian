import { Injectable, Inject, Logger } from '@nestjs/common';
import { Book } from '../../domain/book.aggregate';
import type { IBookRepository } from '../ports/book.repository.interface';

export interface CreateBookCommand {
  title: string;
  sortTitle?: string;
  pubdate?: Date;
  hasCover?: boolean;
}

@Injectable()
export class CreateBookUseCase {
  private readonly logger = new Logger(CreateBookUseCase.name);

  constructor(
    @Inject('IBookRepository')
    private readonly bookRepository: IBookRepository
  ) {}

  async execute(command: CreateBookCommand): Promise<Book> {
    const book = Book.create({
      title: command.title,
      sortTitle: command.sortTitle,
      pubdate: command.pubdate,
      hasCover: command.hasCover,
    });

    await this.bookRepository.save(book);
    
    this.logger.log(`Successfully created and saved book aggregate: ${book.id}`);

    return book;
  }
}
