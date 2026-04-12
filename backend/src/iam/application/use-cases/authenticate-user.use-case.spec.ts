import { UnauthorizedException } from '@nestjs/common';
import { AuthenticateUserUseCase } from './authenticate-user.use-case';
import { IUserRepository } from '../ports/user.repository.interface';
import { IPasswordHasher } from '../ports/password-hasher.interface';
import { User } from '../../domain/user.aggregate';
import { EmailAddress } from '../../domain/value-objects/email-address.value-object';
import { HashedPassword } from '../../domain/value-objects/hashed-password.value-object';
import { Role } from '../../domain/value-objects/role.value-object';

describe('AuthenticateUserUseCase', () => {
  let useCase: AuthenticateUserUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;

  beforeEach(() => {
    userRepository = {
      save: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    } as any;
    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    } as any;
    useCase = new AuthenticateUserUseCase(userRepository, passwordHasher);
  });

  it('should authenticate a user successfully', async () => {
    const request = {
      email: 'test@example.com',
      password: 'password123',
    };

    const user = User.reconstruct(
      'user-id',
      EmailAddress.create(request.email),
      HashedPassword.create('hashed_password123'),
      Role.customer()
    );

    userRepository.findByEmail.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(true);

    const result = await useCase.execute(request);

    expect(result.id).toBe('user-id');
    expect(result.email).toBe(request.email);
    expect(result.role).toBe('CUSTOMER');
    expect(passwordHasher.compare).toHaveBeenCalledWith(request.password, 'hashed_password123');
  });

  it('should throw UnauthorizedException if user not found', async () => {
    const request = {
      email: 'notfound@example.com',
      password: 'password123',
    };

    userRepository.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute(request)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if password does not match', async () => {
    const request = {
      email: 'test@example.com',
      password: 'wrong-password',
    };

    const user = User.reconstruct(
      'user-id',
      EmailAddress.create(request.email),
      HashedPassword.create('hashed_password123'),
      Role.customer()
    );

    userRepository.findByEmail.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(useCase.execute(request)).rejects.toThrow(UnauthorizedException);
    expect(passwordHasher.compare).toHaveBeenCalledWith(request.password, 'hashed_password123');
  });
});
