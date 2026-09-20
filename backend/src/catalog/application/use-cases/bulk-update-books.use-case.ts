import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { Book } from '../../domain/book.aggregate';
import { BulkUpdateCommand } from '../../domain/value-objects/bulk-update-command.value-object';
import type { IBookRepository } from '../ports/book.repository.interface';

@Injectable()
export class BulkUpdateBooksUseCase {
  private readonly logger = new Logger(BulkUpdateBooksUseCase.name);

  constructor(
    @Inject('IBookRepository')
    private readonly bookRepository: IBookRepository,
  ) {}

  async execute(command: BulkUpdateCommand): Promise<Book[]> {
    const updated: Book[] = [];

    for (const rawId of command.bookIds) {
      const id = String(rawId);
      const book = await this.bookRepository.findById(id);
      if (!book) {
        this.logger.warn(`Bulk update aborted: book with ID ${id} not found`);
        throw new NotFoundException(`Book with ID ${id} not found`);
      }

      book.update(command.changes);
      updated.push(await this.bookRepository.update(book));
    }

    this.logger.log(
      `Bulk updated ${updated.length} book(s) (${command.changes.title ?? 'metadata-only'})`,
    );

    return updated;
  }
}
