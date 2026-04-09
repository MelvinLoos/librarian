import { EmailAddress } from './email-address.value-object';

describe('EmailAddress Value Object', () => {
  it('should create a valid email address', () => {
    const email = EmailAddress.create('user@example.com');
    expect(email.value).toBe('user@example.com');
  });

  it('should trim whitespace around the email', () => {
    const email = EmailAddress.create('  test@example.com  ');
    expect(email.value).toBe('test@example.com');
  });

  it('should reject invalid emails', () => {
    expect(() => EmailAddress.create('invalid-email')).toThrow('Invalid email address: invalid-email');
    expect(() => EmailAddress.create('user@')).toThrow('Invalid email address: user@');
    expect(() => EmailAddress.create('@example.com')).toThrow('Invalid email address: @example.com');
    expect(() => EmailAddress.create('user@example')).toThrow('Invalid email address: user@example');
  });

  it('should evaluate equality ignoring case', () => {
    const email1 = EmailAddress.create('USER@example.com');
    const email2 = EmailAddress.create('user@example.com');
    const email3 = EmailAddress.create('other@example.com');
    
    expect(email1.equals(email2)).toBe(true);
    expect(email1.equals(email3)).toBe(false);
  });
});
