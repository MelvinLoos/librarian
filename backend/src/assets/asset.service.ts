import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/infrastructure/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AssetService {
  constructor(private readonly prisma: PrismaService) {}

  async getCoverStream(bookId: number): Promise<fs.ReadStream> {
    // Query the database for the book
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book || !book.path) {
      throw new NotFoundException(`Book with ID ${bookId} not found in the database.`);
    }

    // Construct the absolute path
    // Make sure CALIBRE_LIBRARY_PATH is set in your .env file
    const libraryPath = process.env.CALIBRE_LIBRARY_PATH || '';
    const coverPath = path.join(libraryPath, book.path, 'cover.jpg');

    // Verify file exists on disk
    if (!fs.existsSync(coverPath)) {
      throw new NotFoundException(`Cover image for book ID ${bookId} not found on disk.`);
    }

    return fs.createReadStream(coverPath);
  }
}