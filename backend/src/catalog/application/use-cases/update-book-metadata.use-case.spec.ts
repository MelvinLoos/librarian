/* eslint-disable @typescript-eslint/unbound-method */

import { UpdateBookMetadataUseCase } from './update-book-metadata.use-case';
import { IBookRepository } from '../ports/book.repository.interface';
import { Book } from '../../domain/book.aggregate';
import { NotFoundException } from '@nestjs/common';
import { Rating } from '../../domain/value-objects/rating.value-object';

describe('UpdateBookMetadataUseCase', () => {
  let useCase: UpdateBookMetadataUseCase;
  let repository: jest.Mocked<IBookRepository>;

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };
    useCase = new UpdateBookMetadataUseCase(repository);
  });

  it('should load, update, and persist partial metadata', async () => {
    const existing = Book.create({ title: 'Old Title' }, 'book-1');
    repository.findById.mockResolvedValue(existing);
    repository.update.mockResolvedValue(existing);

    const result = await useCase.execute('book-1', { title: 'New Title' });

    expect(repository.findById).toHaveBeenCalledWith('book-1');
    expect(result.props.title).toBe('New Title');
    expect(repository.update).toHaveBeenCalledWith(existing);
  });

  it('should throw NotFoundException when book does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing', { title: 'x' })).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should map authors, tags, series, identifiers, and rating to domain objects', async () => {
    const existing = Book.create({ title: 'Old' }, 'book-1');
    repository.findById.mockResolvedValue(existing);
    repository.update.mockResolvedValue(existing);

    const result = await useCase.execute('book-1', {
      publisher: 'Tor Books',
      rating: 4.5,
      authors: [{ name: 'Brandon Sanderson' }],
      tags: [{ name: 'Fantasy' }],
      series: { name: 'Mistborn', index: 1 },
      identifiers: [{ type: 'isbn', value: '1234567890' }],
    });

    expect(result.props.publisher).toBe('Tor Books');
    expect(result.props.rating).toBeInstanceOf(Rating);
    expect(result.props.rating!.props.value).toBe(4.5);
    expect(result.props.authors).toHaveLength(1);
    expect(result.props.authors![0].props.name).toBe('Brandon Sanderson');
    expect(result.props.tags).toHaveLength(1);
    expect(result.props.tags![0].props.name).toBe('Fantasy');
    expect(result.props.series!.props.name).toBe('Mistborn');
    expect(result.props.series!.props.index).toBe(1);
    expect(result.props.identifiers).toHaveLength(1);
    expect(result.props.identifiers![0].props.value).toBe('1234567890');
  });

  it('should reject an invalid rating (domain constraint)', async () => {
    const existing = Book.create({ title: 'Old' }, 'book-1');
    repository.findById.mockResolvedValue(existing);

    await expect(useCase.execute('book-1', { rating: 11 })).rejects.toThrow(
      'Rating must be between 0 and 5',
    );
    expect(repository.update).not.toHaveBeenCalled();
  });
});
