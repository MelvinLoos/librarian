import { BcryptPasswordHasher } from './bcrypt-password.hasher';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('BcryptPasswordHasher', () => {
  let hasher: BcryptPasswordHasher;

  beforeEach(() => {
    hasher = new BcryptPasswordHasher();
    jest.clearAllMocks();
  });

  describe('hash', () => {
    it('should delegate to bcrypt.hash with 10 salt rounds', async () => {
      const plainText = 'my-secret-password';
      const expectedHash = '$2b$10$hashedvalue';

      (mockedBcrypt.hash as jest.Mock).mockResolvedValue(expectedHash);

      const result = await hasher.hash(plainText);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(plainText, 10);
      expect(result).toBe(expectedHash);
    });
  });

  describe('compare', () => {
    it('should return true when password matches hash', async () => {
      const plainText = 'my-secret-password';
      const hash = '$2b$10$hashedvalue';

      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await hasher.compare(plainText, hash);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(plainText, hash);
      expect(result).toBe(true);
    });

    it('should return false when password does not match hash', async () => {
      const plainText = 'wrong-password';
      const hash = '$2b$10$hashedvalue';

      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await hasher.compare(plainText, hash);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(plainText, hash);
      expect(result).toBe(false);
    });
  });
});
