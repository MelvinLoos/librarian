import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { AuthenticateUserUseCase } from './application/use-cases/authenticate-user.use-case';
import { UserController } from './presentation/user.controller';
import { AuthController } from './presentation/auth.controller';
import { IUserRepository } from './application/ports/user.repository.interface';
import { IPasswordHasher } from './application/ports/password-hasher.interface';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password.hasher';

@Module({
  imports: [SharedModule],
  controllers: [UserController, AuthController],
  providers: [
    RegisterUserUseCase,
    AuthenticateUserUseCase,
    {
      provide: IUserRepository,
      useClass: PrismaUserRepository,
    },
    {
      provide: IPasswordHasher,
      useClass: BcryptPasswordHasher,
    },
  ],
  exports: [RegisterUserUseCase, AuthenticateUserUseCase],
})
export class IamModule {}
