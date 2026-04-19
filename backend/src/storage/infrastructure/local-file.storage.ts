import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IFileStorage } from '../application/ports/file-storage.interface';
import { join, basename, resolve } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalFileStorage implements IFileStorage {
  private readonly logger = new Logger(LocalFileStorage.name);
  private readonly assetsDir = join('.librarian', 'assets');

  async upload({ buffer, originalName, mimeType }: { buffer: Buffer; originalName: string; mimeType: string }): Promise<string> {
    const safeFileName = basename(originalName);
    const relativePath = join(this.assetsDir, safeFileName);
    const absolutePath = resolve(process.cwd(), relativePath);

    await mkdir(resolve(process.cwd(), this.assetsDir), { recursive: true });
    await writeFile(absolutePath, buffer);

    this.logger.log(`File written to disk: ${absolutePath}`);

    return relativePath;
  }

  async getCoverStream(relativePath: string): Promise<fs.ReadStream> {
    const libraryPath = process.env.CALIBRE_LIBRARY_PATH || '';
    const coverPath = path.join(libraryPath, relativePath, 'cover.jpg');

    if (!fs.existsSync(coverPath)) {
      this.logger.warn(`Cover file does not exist at path: ${coverPath}`);
      throw new NotFoundException('File does not exist');
    }

    return fs.createReadStream(coverPath);
  }

  /**
   * Resolves the absolute path to a book file using the Calibre library structure.
   */
  getBookFilePath(bookFolderPath: string, fileName: string, format: string): string {
    const libraryPath = process.env.CALIBRE_LIBRARY_PATH || '';
    // Calibre stores files as: {Library}/{Author}/{Title}/{Name}.{extension}
    return path.join(libraryPath, bookFolderPath, `${fileName}.${format.toLowerCase()}`);
  }

  /**
   * Returns the total size of the file in bytes.
   */
  async getFileSize(absolutePath: string): Promise<number> {
    try {
      const stats = await fs.promises.stat(absolutePath);
      return stats.size;
    } catch (error) {
      throw new Error(`Could not access file at ${absolutePath}`);
    }
  }

  /**
   * Creates a ReadStream. If start/end are provided, it only reads that byte range.
   */
  createReadStreamWithRange(absolutePath: string, start?: number, end?: number): fs.ReadStream {
    const options: any = {};
    if (start !== undefined) options.start = start;
    if (end !== undefined) options.end = end;

    // highWaterMark defaults to 64KB, ensuring RAM safety
    return fs.createReadStream(absolutePath, options);
  }
}