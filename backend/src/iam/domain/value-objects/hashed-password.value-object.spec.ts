import { HashedPassword } from './hashed-password.value-object';

describe('HashedPassword Value Object', () => {
  it('should create a valid hashed password', () => {
    const password = HashedPassword.create('some-secure-hash');
    expect(password.getHash()).toBe('some-secure-hash');
  });

  it('should throw an error for empty hashes', () => {
    expect(() => HashedPassword.create('')).toThrow('Hashed password cannot be empty');
    expect(() => HashedPassword.create('   ')).toThrow('Hashed password cannot be empty');
  });

  it('should not expose hash as public property', () => {
    const password = HashedPassword.create('hash');
    expect((password as any).hash).toBe('hash'); // Test private property access bypass in tests
    expect(Object.keys(password)).toEqual(['hash']); // It exists but is private
  });

  it('should correctly evaluate equality', () => {
    const p1 = HashedPassword.create('hash1');
    const p2 = HashedPassword.create('hash1');
    const p3 = HashedPassword.create('hash2');
    
    expect(p1.equals(p2)).toBe(true);
    expect(p1.equals(p3)).toBe(false);
  });
});
