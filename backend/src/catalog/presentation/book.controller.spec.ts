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
  });
});
