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
}