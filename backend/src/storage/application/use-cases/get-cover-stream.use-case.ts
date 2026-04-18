import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import type { ILegacyBookRepository } from '../ports/legacy-book-repository.interface';
import type { IFileStorage } from '../ports/file-storage.interface';
import { ReadStream } from 'fs';

@Injectable()
export class GetCoverStreamUseCase {
  private readonly logger = new Logger(GetCoverStreamUseCase.name);

  constructor(
    @Inject('ILegacyBookRepository')
    private readonly bookRepository: ILegacyBookRepository,
    @Inject('IFileStorage')
    private readonly fileStorage: IFileStorage,
  ) {}

  async execute(bookId: number): Promise<ReadStream> {
    const bookPath = await this.bookRepository.getBookPath(bookId);

    if (!bookPath) {
      this.logger.warn(`Cover stream requested for non-existent book ID: ${bookId}`);
      throw new NotFoundException(`Book with ID ${bookId} not found in the database.`);
    }

    try {
      return await this.fileStorage.getCoverStream(bookPath);
    } catch (error) {
      this.logger.error(`Failed to get cover stream for book ID: ${bookId} from path: ${bookPath}`, error instanceof Error ? error.stack : undefined);
      throw new NotFoundException(`Cover image for book ID ${bookId} not found on disk.`);
    }
  }
}