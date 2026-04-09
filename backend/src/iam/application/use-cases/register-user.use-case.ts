import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { IUserRepository } from '../ports/user.repository.interface';
import { User } from '../../domain/user.aggregate';
import { EmailAddress } from '../../domain/value-objects/email-address.value-object';
import { HashedPassword } from '../../domain/value-objects/hashed-password.value-object';
import { Role } from '../../domain/value-objects/role.value-object';

export interface RegisterUserRequest {
  email: string;
  password: string; // This would be hashed by a service in a real app, for now we mock hashing
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
  ) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    const email = EmailAddress.create(request.email);
    
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Mocking ID generation and hashing for now as per constraints
    const id = Math.random().toString(36).substring(2, 15);
    const hashedPassword = HashedPassword.create(`hashed_${request.password}`);
    const role = Role.customer();

    const user = User.create(id, email, hashedPassword, role);
    
    await this.userRepository.save(user);

    return {
      id: user.id,
      email: user.email.value,
      role: user.role.value,
    };
  }
}
