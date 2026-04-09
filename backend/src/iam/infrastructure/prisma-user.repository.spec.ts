import { PrismaUserRepository } from './prisma-user.repository';
import { User } from '../domain/user.aggregate';
import { EmailAddress } from '../domain/value-objects/email-address.value-object';
import { HashedPassword } from '../domain/value-objects/hashed-password.value-object';
import { Role } from '../domain/value-objects/role.value-object';

const mockPrismaService = {
  user: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe('PrismaUserRepository', () => {
  let repository: PrismaUserRepository;

  beforeEach(() => {
    repository = new PrismaUserRepository(mockPrismaService as any);
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should upsert the user into the database', async () => {
      const user = User.create(
        'user-123',
        EmailAddress.create('test@example.com'),
        HashedPassword.create('$2b$10$hashedvalue'),
        Role.customer(),
      );

      mockPrismaService.user.upsert.mockResolvedValue(undefined);

      await repository.save(user);

      expect(mockPrismaService.user.upsert).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        update: {
          email: 'test@example.com',
          passwordHash: '$2b$10$hashedvalue',
          role: 'CUSTOMER',
        },
        create: {
          id: 'user-123',
          email: 'test@example.com',
          passwordHash: '$2b$10$hashedvalue',
          role: 'CUSTOMER',
        },
      });
    });
  });

  describe('findByEmail', () => {
    it('should return a User aggregate when found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: '$2b$10$hashedvalue',
        role: 'READER',
        createdAt: new Date(),
      });

      const email = EmailAddress.create('test@example.com');
      const result = await repository.findByEmail(email);

      expect(result).toBeInstanceOf(User);
      expect(result!.id).toBe('user-123');
      expect(result!.email.value).toBe('test@example.com');
      expect(result!.password.getHash()).toBe('$2b$10$hashedvalue');
      expect(result!.role.value).toBe('READER');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const email = EmailAddress.create('notfound@example.com');
      const result = await repository.findByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a User aggregate when found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-456',
        email: 'admin@example.com',
        passwordHash: '$2b$10$adminhashedvalue',
        role: 'ADMIN',
        createdAt: new Date(),
      });

      const result = await repository.findById('user-456');

      expect(result).toBeInstanceOf(User);
      expect(result!.id).toBe('user-456');
      expect(result!.email.value).toBe('admin@example.com');
      expect(result!.role.value).toBe('ADMIN');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-456' },
      });
    });

    it('should return null when user not found by id', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('toDomain mapping', () => {
    it('should use User.reconstruct to avoid firing domain events', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-789',
        email: 'quiet@example.com',
        passwordHash: '$2b$10$quiethash',
        role: 'CONTRIBUTOR',
        createdAt: new Date(),
      });

      const result = await repository.findById('user-789');

      // reconstruct should NOT fire UserRegisteredEvent
      expect(result!.domainEvents).toHaveLength(0);
    });
  });
});
