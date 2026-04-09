import { ByteSize } from './byte-size.value-object';

describe('ByteSize', () => {
  it('should create a valid ByteSize for 0 bytes', () => {
    const size = new ByteSize(0);
    expect(size.value).toBe(0);
  });

  it('should create a valid ByteSize for positive bytes', () => {
    const size = new ByteSize(1024);
    expect(size.value).toBe(1024);
  });

  it('should throw an error for negative bytes', () => {
    expect(() => new ByteSize(-1)).toThrow('ByteSize cannot be negative');
  });

  it('should throw an error if value is not an integer', () => {
    expect(() => new ByteSize(10.5)).toThrow('ByteSize must be an integer');
  });

  it('should check equality correctly', () => {
    const size1 = new ByteSize(100);
    const size2 = new ByteSize(100);
    const size3 = new ByteSize(200);

    expect(size1.equals(size2)).toBe(true);
    expect(size1.equals(size3)).toBe(false);
  });
});
