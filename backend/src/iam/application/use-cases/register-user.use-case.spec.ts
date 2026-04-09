import { ConflictException } from '@nestjs/common';
import { RegisterUserUseCase } from './register-user.use-case';
import { IUserRepository } from '../ports/user.repository.interface';
import { User } from '../../domain/user.aggregate';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    userRepository = {
      save: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    } as any;
    useCase = new RegisterUserUseCase(userRepository);
  });

  it('should register a user successfully', async () => {
    const request = {
      email: 'test@example.com',
      password: 'password123',
    };

    userRepository.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute(request);

    expect(result.email).toBe(request.email);
    expect(result.role).toBe('CUSTOMER');
    expect(userRepository.save).toHaveBeenCalled();
    const savedUser = userRepository.save.mock.calls[0][0];
    expect(savedUser).toBeInstanceOf(User);
    expect(savedUser.email.value).toBe(request.email);
  });

  it('should throw ConflictException if user email already exists', async () => {
    const request = {
      email: 'existing@example.com',
      password: 'password123',
    };

    userRepository.findByEmail.mockResolvedValue({} as User);

    await expect(useCase.execute(request)).rejects.toThrow(ConflictException);
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('should throw error if email is invalid', async () => {
    const request = {
      email: 'invalid-email',
      password: 'password123',
    };

    await expect(useCase.execute(request)).rejects.toThrow();
  });
});
