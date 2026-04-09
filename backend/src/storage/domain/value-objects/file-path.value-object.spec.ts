import { FilePath } from './file-path.value-object';

describe('FilePath', () => {
  it('should create a valid FilePath for a standard relative path', () => {
    const path = new FilePath('books/1/book.epub');
    expect(path.value).toBe('books/1/book.epub');
  });

  it('should throw an error for an empty path', () => {
    expect(() => new FilePath('')).toThrow('FilePath cannot be empty');
    expect(() => new FilePath('   ')).toThrow('FilePath cannot be empty');
  });

  it('should throw an error for paths containing directory traversal', () => {
    expect(() => new FilePath('books/../book.epub')).toThrow('FilePath cannot contain directory traversal characters (..)');
  });

  it('should throw an error for absolute paths', () => {
    expect(() => new FilePath('/books/1/book.epub')).toThrow('FilePath must be a relative path');
  });

  it('should trim the input string', () => {
    const path = new FilePath('  my-book.epub  ');
    expect(path.value).toBe('my-book.epub');
  });

  it('should check equality correctly', () => {
    const path1 = new FilePath('books/1.epub');
    const path2 = new FilePath('books/1.epub');
    const path3 = new FilePath('books/2.epub');

    expect(path1.equals(path2)).toBe(true);
    expect(path1.equals(path3)).toBe(false);
  });
});
