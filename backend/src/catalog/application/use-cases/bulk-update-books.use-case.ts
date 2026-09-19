import { Inject, Injectable } from '@nestjs/common';
import { Book } from '../../domain/book.aggregate';
import { BulkUpdateCommand } from '../../domain/value-objects/bulk-update-command.value-object';
import type { IBookRepository } from '../ports/book.repository.interface';

@Injectable()
export class BulkUpdateBooksUseCase {
  constructor(
    @Inject('IBookRepository')
    private readonly bookRepository: IBookRepository,
  ) {}

  async execute(command: BulkUpdateCommand): Promise<Book[]> {
    throw new Error('Not implemented');
  }
}