/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */

import { Test, TestingModule } from '@nestjs/testing';
import { BookController } from './book.controller';
import { GetBookUseCase } from '../application/use-cases/get-book.use-case';
import { UpdateBookMetadataUseCase } from '../application/use-cases/update-book-metadata.use-case';
import { CreateBookUseCase } from '../application/use-cases/create-book.use-case';
import { BulkUpdateBooksUseCase } from '../application/use-cases/bulk-update-books.use-case';
import { UpdateBookMetadataDto } from './dto/update-book-metadata.dto';
import { BulkUpdateCommand } from '../domain/value-objects/bulk-update-command.value-object';
import { Book } from '../domain/book.aggregate';
import { Author } from '../domain/entities/author.entity';
import { Tag } from '../domain/entities/tag.entity';
import { Series } from '../domain/entities/series.entity';
import { Rating } from '../domain/value-objects/rating.value-object';
import { Identifier } from '../domain/value-objects/identifier.value-object';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { NotFoundException } from '@nestjs/common';

describe('BookController & UpdateBookMetadataDto', () => {
  describe('UpdateBookMetadataDto Validation', () => {
    it('should accept a fully valid payload', async () => {
      const dto = plainToInstance(UpdateBookMetadataDto, {
        title: 'The Way of Kings',
        publisher: 'Tor Books',
        rating: 4.5,
        authors: [{ name: 'Brandon Sanderson' }],
        tags: [{ name: 'Fantasy' }],
        series: { name: 'The Stormlight Archive', index: 1 },
        identifiers: [{ type: 'isbn', value: '9780765326355' }],
        description: 'Epic fantasy',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept a partial payload (all optional)', async () => {
      const dto = plainToInstance(UpdateBookMetadataDto, {
        title: 'Only Title',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject a rating outside 0-5', async () => {
      const dto = plainToInstance(UpdateBookMetadataDto, { rating: 6 });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('rating');

      const dto2 = plainToInstance(UpdateBookMetadataDto, { rating: -1 });
      const errors2 = await validate(dto2);
      expect(errors2).toHaveLength(1);
      expect(errors2[0].property).toBe('rating');
    });

    it('should reject an empty title', async () => {
      const dto = plainToInstance(UpdateBookMetadataDto, { title: '' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'title')).toBe(true);
    });
  });

  describe('BookController.updateMetadata', () => {
    let controller: BookController;
    let updateUseCase: jest.Mocked<UpdateBookMetadataUseCase>;
    let getUseCase: jest.Mocked<GetBookUseCase>;

    beforeEach(async () => {
      updateUseCase = { execute: jest.fn() } as any;
      getUseCase = { execute: jest.fn() } as any;

      const module: TestingModule = await Test.createTestingModule({
        controllers: [BookController],
        providers: [
          { provide: UpdateBookMetadataUseCase, useValue: updateUseCase },
          { provide: GetBookUseCase, useValue: getUseCase },
          { provide: CreateBookUseCase, useValue: { execute: jest.fn() } },
          { provide: BulkUpdateBooksUseCase, useValue: { execute: jest.fn() } },
        ],
      }).compile();

      controller = module.get<BookController>(BookController);
    });

    it('should delegate to the update use case and return the updated fields', async () => {
      const book = Book.create({ title: 'New Title' }, '1');
      updateUseCase.execute.mockResolvedValue(book);

      const dto: UpdateBookMetadataDto = { title: 'New Title' };
      const result = await controller.updateMetadata('1', dto);

      expect(updateUseCase.execute).toHaveBeenCalledWith('1', dto);
      expect(result).toEqual({
        id: '1',
        title: 'New Title',
        publisher: undefined,
        rating: undefined,
        series: undefined,
        tags: [],
        identifiers: [],
        authors: [],
      });
    });

    it('should propagate errors from the use case', async () => {
      updateUseCase.execute.mockRejectedValue(new Error('DB down'));

      await expect(
        controller.updateMetadata('1', { title: 'X' }),
      ).rejects.toThrow('DB down');
    });
  });

  describe('BookController.bulkUpdate', () => {
    let controller: BookController;
    let bulkUseCase: jest.Mocked<BulkUpdateBooksUseCase>;

    beforeEach(async () => {
      bulkUseCase = { execute: jest.fn() } as any;

      const module: TestingModule = await Test.createTestingModule({
        controllers: [BookController],
        providers: [
          {
            provide: UpdateBookMetadataUseCase,
            useValue: { execute: jest.fn() },
          },
          { provide: GetBookUseCase, useValue: { execute: jest.fn() } },
          { provide: CreateBookUseCase, useValue: { execute: jest.fn() } },
          { provide: BulkUpdateBooksUseCase, useValue: bulkUseCase },
        ],
      }).compile();

      controller = module.get<BookController>(BookController);
    });

    it('should apply the bulk command and return the updated books', async () => {
      bulkUseCase.execute.mockResolvedValue([
        Book.create({ title: 'Dune', publisher: 'Chilton Books' }, '1'),
        Book.create({ title: 'Dune', publisher: 'Chilton Books' }, '2'),
      ]);

      const result = await controller.bulkUpdate({
        bookIds: [1, 2],
        changes: { publisher: 'Chilton Books' },
      } as any);

      expect(bulkUseCase.execute).toHaveBeenCalledWith(
        expect.any(BulkUpdateCommand),
      );
      expect(result).toHaveLength(2);
    });

    it('should rethrow NotFoundException from the use case', async () => {
      bulkUseCase.execute.mockRejectedValue(
        new NotFoundException('Book with ID 9 not found'),
      );

      await expect(
        controller.bulkUpdate({ bookIds: [9], changes: {} } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return the canonical single-book edit shape for every book', async () => {
      const book = Book.create(
        {
          title: 'Dune',
          publisher: 'Chilton Books',
          rating: new Rating({ value: 4.5 }),
          description: 'Epic sci-fi.',
          series: new Series({ name: 'Dune Saga', index: 1 }, '3'),
          tags: [
            new Tag({ name: 'Sci-Fi' }, '7'),
            new Tag({ name: 'Classic' }, '8'),
          ],
          authors: [new Author({ name: 'Frank Herbert' }, '5')],
          identifiers: [
            new Identifier({ type: 'isbn', value: '9780441172719' }),
          ],
        },
        '1',
      );
      bulkUseCase.execute.mockResolvedValue([book]);

      const result = await controller.bulkUpdate({
        bookIds: [1],
        changes: { publisher: 'Chilton Books' },
      } as any);

      expect(result[0]).toEqual({
        id: '1',
        title: 'Dune',
        publisher: 'Chilton Books',
        rating: 4.5,
        series: { id: '3', name: 'Dune Saga', index: 1 },
        tags: [
          { id: '7', name: 'Sci-Fi' },
          { id: '8', name: 'Classic' },
        ],
        identifiers: [{ type: 'isbn', value: '9780441172719' }],
        description: 'Epic sci-fi.',
        authors: [{ id: '5', name: 'Frank Herbert' }],
      });
    });

    it('should not leak raw domain entities (_id/props) in the JSON response', async () => {
      const book = Book.create(
        {
          title: 'Dune',
          tags: [new Tag({ name: 'Sci-Fi' }, '7')],
          series: new Series({ name: 'Dune Saga', index: 1 }, '3'),
        },
        '1',
      );
      bulkUseCase.execute.mockResolvedValue([book]);

      const result = await controller.bulkUpdate({
        bookIds: [1],
        changes: {},
      } as any);

      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('_id');
      expect(serialized).not.toContain('props');
    });
  });

  describe('BookController.findOne canonical DTO', () => {
    let controller: BookController;
    let getUseCase: jest.Mocked<GetBookUseCase>;

    beforeEach(async () => {
      getUseCase = { execute: jest.fn() } as any;

      const module: TestingModule = await Test.createTestingModule({
        controllers: [BookController],
        providers: [
          {
            provide: UpdateBookMetadataUseCase,
            useValue: { execute: jest.fn() },
          },
          { provide: GetBookUseCase, useValue: getUseCase },
          { provide: CreateBookUseCase, useValue: { execute: jest.fn() } },
          { provide: BulkUpdateBooksUseCase, useValue: { execute: jest.fn() } },
        ],
      }).compile();

      controller = module.get<BookController>(BookController);
    });

    it('should return tags as flat {id, name} primitives', async () => {
      getUseCase.execute.mockResolvedValue(
        Book.create(
          { title: 'Dune', tags: [new Tag({ name: 'Sci-Fi' }, '7')] },
          '1',
        ),
      );

      const result = await controller.findOne('1');

      expect(result.tags).toEqual([{ id: '7', name: 'Sci-Fi' }]);
    });

    it('should return series as a flat {id, name, index} object', async () => {
      getUseCase.execute.mockResolvedValue(
        Book.create(
          {
            title: 'Dune',
            series: new Series({ name: 'Dune Saga', index: 1 }, '3'),
          },
          '1',
        ),
      );

      const result = await controller.findOne('1');

      expect(result.series).toEqual({ id: '3', name: 'Dune Saga', index: 1 });
    });

    it('should not leak _id or props in the serialized response', async () => {
      getUseCase.execute.mockResolvedValue(
        Book.create(
          {
            title: 'Dune',
            tags: [new Tag({ name: 'Sci-Fi' }, '7')],
            series: new Series({ name: 'Dune Saga', index: 1 }, '3'),
          },
          '1',
        ),
      );

      const result = await controller.findOne('1');

      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('_id');
      expect(serialized).not.toContain('props');
    });
  });

  describe('BookController DTO consistency (single edits vs reads)', () => {
    let controller: BookController;
    let updateUseCase: jest.Mocked<UpdateBookMetadataUseCase>;
    let getUseCase: jest.Mocked<GetBookUseCase>;

    beforeEach(async () => {
      updateUseCase = { execute: jest.fn() } as any;
      getUseCase = { execute: jest.fn() } as any;

      const module: TestingModule = await Test.createTestingModule({
        controllers: [BookController],
        providers: [
          { provide: UpdateBookMetadataUseCase, useValue: updateUseCase },
          { provide: GetBookUseCase, useValue: getUseCase },
          { provide: CreateBookUseCase, useValue: { execute: jest.fn() } },
          { provide: BulkUpdateBooksUseCase, useValue: { execute: jest.fn() } },
        ],
      }).compile();

      controller = module.get<BookController>(BookController);
    });

    const buildRichBook = (id = '1') =>
      Book.create(
        {
          title: 'Dune',
          publisher: 'Chilton Books',
          description: 'Epic sci-fi.',
          series: new Series({ name: 'Dune Saga', index: 1 }, '3'),
          tags: [new Tag({ name: 'Sci-Fi' }, '7')],
          authors: [new Author({ name: 'Frank Herbert' }, '5')],
          identifiers: [
            new Identifier({ type: 'isbn', value: '9780441172719' }),
          ],
        },
        id,
      );

    it('should expose the identical tag shape from findOne and updateMetadata', async () => {
      const book = buildRichBook();
      getUseCase.execute.mockResolvedValue(book);
      updateUseCase.execute.mockResolvedValue(book);

      const read = await controller.findOne('1');
      const edit = await controller.updateMetadata('1', {
        title: 'Dune',
      } as UpdateBookMetadataDto);

      expect(edit.tags).toEqual(read.tags);
      expect(edit.tags).toEqual([{ id: '7', name: 'Sci-Fi' }]);
    });

    it('should expose the identical author shape from findOne and updateMetadata', async () => {
      const book = buildRichBook();
      getUseCase.execute.mockResolvedValue(book);
      updateUseCase.execute.mockResolvedValue(book);

      const read = await controller.findOne('1');
      const edit = await controller.updateMetadata('1', {
        title: 'Dune',
      } as UpdateBookMetadataDto);

      expect(edit.authors).toEqual(read.authors);
      expect(edit.authors).toEqual([{ id: '5', name: 'Frank Herbert' }]);
    });

    it('should expose the identical series shape from findOne and updateMetadata', async () => {
      const book = buildRichBook();
      getUseCase.execute.mockResolvedValue(book);
      updateUseCase.execute.mockResolvedValue(book);

      const read = await controller.findOne('1');
      const edit = await controller.updateMetadata('1', {
        title: 'Dune',
      } as UpdateBookMetadataDto);

      expect(edit.series).toEqual(read.series);
    });
  });
});
