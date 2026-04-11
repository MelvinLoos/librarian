import { ReadStream } from 'fs';

export interface IFileStorage {
  /**
   * Stores a file and returns the relative path where it is stored.
   */
  upload(file: { buffer: Buffer; originalName: string; mimeType: string }): Promise<string>;
  getCoverStream(relativePath: string): Promise<ReadStream>;
}
