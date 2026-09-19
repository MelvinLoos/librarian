import { ReadStream } from 'fs';

export interface IFileStorage {
  /**
   * Stores a file and returns the relative path where it is stored.
   */
  upload(file: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
  }): Promise<string>;

  /**
   * Saves an extracted cover image into the storage covers directory.
   * Returns the relative path of the stored cover.
   */
  saveCover(buffer: Buffer, assetId: string, mimeType: string): Promise<string>;

  getCoverStream(relativePath: string): Promise<ReadStream>;
  getBookFilePath(
    bookFolderPath: string,
    fileName: string,
    format: string,
  ): string;
  getFileSize(absolutePath: string): Promise<number>;
  createReadStreamWithRange(
    absolutePath: string,
    start?: number,
    end?: number,
  ): ReadStream;
}
