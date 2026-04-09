import { GetBookUseCase } from './get-book.use-case';
import { IBookRepository } from '../ports/book.repository.interface';
import { Book } from '../../domain/book.aggregate';
import { NotFoundException } from '@nestjs/common';

describe('GetBookUseCase', () => {
  let useCase: GetBookUseCase;
  let repository: jest.Mocked<IBookRepository>;

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
    };
    useCase = new GetBookUseCase(repository);
  });

  it('should return a book if it exists', async () => {
    const book = Book.create({ title: 'Standard Book' }, 'test-id');
    repository.findById.mockResolvedValue(book);

    const result = await useCase.execute('test-id');

    expect(result).toBe(book);
    expect(repository.findById).toHaveBeenCalledWith('test-id');
  });

  it('should throw NotFoundException if book does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('non-existent'))
      .rejects.toThrow(NotFoundException);
  });

  it('should return all books', async () => {
    const books = [
      Book.create({ title: 'Book 1' }),
      Book.create({ title: 'Book 2' }),
    ];
    repository.findAll.mockResolvedValue(books);

    const result = await useCase.executeAll();

    expect(result).toEqual(books);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });
});
