import { Module } from '@nestjs/common';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { AuthenticateUserUseCase } from './application/use-cases/authenticate-user.use-case';
import { UserController } from './presentation/user.controller';
import { AuthController } from './presentation/auth.controller';

@Module({
  controllers: [UserController, AuthController],
  providers: [
    RegisterUserUseCase,
    AuthenticateUserUseCase,
    // Note: IUserRepository is not provided here yet because we don't have an infrastructure implementation.
    // It will be provided by the Infrastructure layer in a real scenario.
    // However, to make the module "valid" for NestJS if it were to start, 
    // we would need to provide a mock repository here.
  ],
  exports: [RegisterUserUseCase, AuthenticateUserUseCase],
})
export class IamModule {}
