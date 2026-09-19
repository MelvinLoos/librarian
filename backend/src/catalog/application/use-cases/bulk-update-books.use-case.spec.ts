import { Test, TestingModule } from '@nestjs/testing';
import { BulkUpdateBooksUseCase } from './bulk-update-books.use-case';
import { BulkUpdateCommand } from '../../domain/value-objects/bulk-update-command.value-object';
import { Book } from '../../domain/book.aggregate';
import type { IBookRepository } from '../ports/book.repository.interface';
import { NotFoundException } from '@nestjs/common';

describe('BulkUpdateBooksUseCase', () => {
  let useCase: BulkUpdateBooksUseCase;
  let bookRepository: jest.Mocked<IBookRepository>;

  const makeBook = (id: string): Book => Book.create({ title: `Book ${id}` }, id);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkUpdateBooksUseCase,
        {
          provide: 'IBookRepository',
          useValue: {
            findById: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(BulkUpdateBooksUseCase);
    bookRepository = module.get('IBookRepository') as jest.Mocked<IBookRepository>;
  });

  it('should apply the same metadata changes to every requested book', async () => {
    const books = { 1: makeBook('1'), 2: makeBook('2') };
    bookRepository.findById.mockImplementation(async (id: string) =>
      books[Number(id)] ?? null,
    );
    bookRepository.update.mockImplementation(async (book: Book) => book);

    const command = BulkUpdateCommand.fromRaw([1, 2], {
      publisher: 'Chilton Books',
      rating: 5,
    });

    const updated = await useCase.execute(command);

    expect(updated).toHaveLength(2);
    expect(bookRepository.findById).toHaveBeenCalledTimes(2);
    expect(bookRepository.update).toHaveBeenCalledTimes(2);
    expect(updated.every((b) => b.props.publisher === 'Chilton Books')).toBe(true);
    expect(updated.every((b) => b.props.rating !== undefined)).toBe(true);
  });

  it('should throw NotFoundException when any book is missing', async () => {
    bookRepository.findById.mockResolvedValue(null);

    const command = BulkUpdateCommand.fromRaw([1], { description: 'x' });

    await expect(useCase.execute(command)).rejects.toThrow(NotFoundException);
    expect(bookRepository.update).not.toHaveBeenCalled();
  });
});