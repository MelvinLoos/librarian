import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { LocalFileStorage } from './local-file.storage';

jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn(),
}));

describe('LocalFileStorage', () => {
  let storage: LocalFileStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    storage = new LocalFileStorage();
  });

  it('should write the uploaded file to .librarian/assets and return the relative path', async () => {
    const buffer = Buffer.from('ebook content');
    const result = await storage.upload({
      buffer,
      originalName: 'test.epub',
      mimeType: 'application/epub+zip',
    });

    expect(mkdir).toHaveBeenCalledWith(expect.stringContaining(join('.librarian', 'assets')), { recursive: true });
    expect(writeFile).toHaveBeenCalledWith(expect.any(String), buffer);
    expect(result).toBe(join('.librarian', 'assets', 'test.epub'));
  });

  it('should sanitize the original file name to prevent path traversal', async () => {
    const buffer = Buffer.from('ebook content');

    const result = await storage.upload({
      buffer,
      originalName: '../secret/test.epub',
      mimeType: 'application/epub+zip',
    });

    expect(result).toBe(join('.librarian', 'assets', 'test.epub'));
    expect(writeFile).toHaveBeenCalledWith(expect.stringContaining(join('.librarian', 'assets', 'test.epub')), buffer);
  });
});
