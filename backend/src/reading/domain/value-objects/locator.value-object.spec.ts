import { Locator } from './locator.value-object';

describe('Locator (Value Object)', () => {
  describe('create', () => {
    it('should create a Locator from a valid EPUB CFI string', () => {
      const locator = Locator.create('epubcfi(/6/4[chap-2]!/4/2/10/1:0)');
      expect(locator.value).toBe('epubcfi(/6/4[chap-2]!/4/2/10/1:0)');
    });

    it('should create a Locator from a PDF page identifier', () => {
      const locator = Locator.create('page=42');
      expect(locator.value).toBe('page=42');
    });

    it('should trim surrounding whitespace', () => {
      const locator = Locator.create('  epubcfi(/6/4!/4/2/1:0)  ');
      expect(locator.value).toBe('epubcfi(/6/4!/4/2/1:0)');
    });

    it('should throw when the locator is empty', () => {
      expect(() => Locator.create('')).toThrow(
        new Error('Locator must not be empty'),
      );
    });

    it('should throw when the locator is only whitespace', () => {
      expect(() => Locator.create('   ')).toThrow(
        new Error('Locator must not be empty'),
      );
    });

    it('should throw when the locator exceeds 1024 characters', () => {
      const tooLong = 'a'.repeat(1025);
      expect(() => Locator.create(tooLong)).toThrow(
        new Error('Locator exceeds maximum length of 1024 characters'),
      );
    });
  });

  describe('equals', () => {
    it('should return true for identical locator values', () => {
      const a = Locator.create('epubcfi(/6/4!/4/2/1:0)');
      const b = Locator.create('epubcfi(/6/4!/4/2/1:0)');
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different locator values', () => {
      const a = Locator.create('epubcfi(/6/4!/4/2/1:0)');
      const b = Locator.create('epubcfi(/6/4!/4/2/1:9)');
      expect(a.equals(b)).toBe(false);
    });
  });
});
