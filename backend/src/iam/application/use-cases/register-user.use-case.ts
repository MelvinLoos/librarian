import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IUserRepository } from '../ports/user.repository.interface';
import { IPasswordHasher } from '../ports/password-hasher.interface';
import { User } from '../../domain/user.aggregate';
import { EmailAddress } from '../../domain/value-objects/email-address.value-object';
import { HashedPassword } from '../../domain/value-objects/hashed-password.value-object';
import { Role } from '../../domain/value-objects/role.value-object';

export interface RegisterUserRequest {
  email: string;
  password: string;
}

export interface RegisterUserResponse {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
    @Inject(IPasswordHasher)
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    const email = EmailAddress.create(request.email);
    
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const id = randomUUID();
    const passwordHash = await this.passwordHasher.hash(request.password);
    const hashedPassword = HashedPassword.create(passwordHash);
    const role = Role.reader();

    const user = User.create(id, email, hashedPassword, role);
    
    await this.userRepository.save(user);

    return {
      id: user.id,
      email: user.email.value,
      role: user.role.value,
    };
  }
}
