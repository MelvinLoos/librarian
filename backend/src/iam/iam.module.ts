import { Module } from '@nestjs/common';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { AuthenticateUserUseCase } from './application/use-cases/authenticate-user.use-case';
import { UserController } from './presentation/user.controller';
import { AuthController } from './presentation/auth.controller';

import { IUserRepository } from './application/ports/user.repository.interface';
import { User } from './domain/user.aggregate';
import { EmailAddress } from './domain/value-objects/email-address.value-object';

class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async findByEmail(email: EmailAddress): Promise<User | null> {
    return Array.from(this.users.values()).find(u => u.email.value === email.value) || null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }
}

@Module({
  controllers: [UserController, AuthController],
  providers: [
    RegisterUserUseCase,
    AuthenticateUserUseCase,
    {
      provide: IUserRepository,
      useClass: InMemoryUserRepository,
    },
  ],
  exports: [RegisterUserUseCase, AuthenticateUserUseCase],
})
export class IamModule {}
