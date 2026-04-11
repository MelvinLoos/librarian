import { IFileStorage } from '../application/ports/file-storage.interface';
import { join, basename, resolve } from 'path';
import { mkdir, writeFile } from 'fs/promises';

export class LocalFileStorage implements IFileStorage {
  private readonly assetsDir = join('.librarian', 'assets');

  async upload({ buffer, originalName, mimeType }: { buffer: Buffer; originalName: string; mimeType: string }): Promise<string> {
    const safeFileName = basename(originalName);
    const relativePath = join(this.assetsDir, safeFileName);
    const absolutePath = resolve(process.cwd(), relativePath);

    await mkdir(resolve(process.cwd(), this.assetsDir), { recursive: true });
    await writeFile(absolutePath, buffer);

    return relativePath;
  }
}