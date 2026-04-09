import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from '../ports/user.repository.interface';
import { EmailAddress } from '../../domain/value-objects/email-address.value-object';

export interface AuthenticateUserRequest {
  email: string;
  password: string;
}

export interface AuthenticateUserResponse {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthenticateUserUseCase {
  constructor(
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: AuthenticateUserRequest): Promise<AuthenticateUserResponse> {
    const email = EmailAddress.create(request.email);
    
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Mocking password verification for now as per constraints
    const isPasswordValid = user.password.getHash() === `hashed_${request.password}`;
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      id: user.id,
      email: user.email.value,
      role: user.role.value,
    };
  }
}
