import { MimeType } from './mime-type.value-object';

describe('MimeType', () => {
  it('should create a valid MimeType for a standard format', () => {
    const mime = new MimeType('application/epub+zip');
    expect(mime.value).toBe('application/epub+zip');
  });

  it('should trim and lowercase the value', () => {
    const mime = new MimeType('  Image/JPEG  ');
    expect(mime.value).toBe('image/jpeg');
  });

  it('should throw an error for empty strings', () => {
    expect(() => new MimeType('')).toThrow('MimeType cannot be empty');
    expect(() => new MimeType('   ')).toThrow('MimeType cannot be empty');
  });

  it('should throw an error for invalid formats', () => {
    expect(() => new MimeType('invalid-mime-type')).toThrow('Invalid MimeType format');
    expect(() => new MimeType('application/')).toThrow('Invalid MimeType format');
    expect(() => new MimeType('/jpeg')).toThrow('Invalid MimeType format');
  });

  it('should check equality correctly', () => {
    const mime1 = new MimeType('application/json');
    const mime2 = new MimeType('application/json');
    const mime3 = new MimeType('text/plain');

    expect(mime1.equals(mime2)).toBe(true);
    expect(mime1.equals(mime3)).toBe(false);
  });
});
