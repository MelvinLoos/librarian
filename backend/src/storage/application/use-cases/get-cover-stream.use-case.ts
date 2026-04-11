import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ILegacyBookRepository } from '../ports/legacy-book-repository.interface';
import type { IFileStorage } from '../ports/file-storage.interface';
import { ReadStream } from 'fs';

@Injectable()
export class GetCoverStreamUseCase {
  constructor(
    @Inject('ILegacyBookRepository')
    private readonly bookRepository: ILegacyBookRepository,
    @Inject('IFileStorage')
    private readonly fileStorage: IFileStorage,
  ) {}

  async execute(bookId: number): Promise<ReadStream> {
    const bookPath = await this.bookRepository.getBookPath(bookId);

    if (!bookPath) {
      throw new NotFoundException(`Book with ID ${bookId} not found in the database.`);
    }

    try {
      return await this.fileStorage.getCoverStream(bookPath);
    } catch (error) {
      throw new NotFoundException(`Cover image for book ID ${bookId} not found on disk.`);
    }
  }
}