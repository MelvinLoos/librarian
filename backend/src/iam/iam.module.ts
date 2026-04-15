import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SharedModule } from '../shared/shared.module';

// Controllers
import { UserController } from './presentation/user.controller';
import { AuthController } from './presentation/auth.controller';

// Use Cases
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { AuthenticateUserUseCase } from './application/use-cases/authenticate-user.use-case';

// Ports
import { IUserRepository } from './application/ports/user.repository.interface';
import { IPasswordHasher } from './application/ports/password-hasher.interface';

// Infrastructure Adapters
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password.hasher';

// Auth
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [
    SharedModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [
    UserController,
    AuthController,
  ],
  providers: [
    // Application Use Cases
    RegisterUserUseCase,
    AuthenticateUserUseCase,

    // Auth
    AuthService,
    JwtStrategy,
    RolesGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // Infrastructure Adapters bound to their Interface Tokens
    {
      provide: IUserRepository,
      useClass: PrismaUserRepository,
    },
    {
      provide: IPasswordHasher,
      useClass: BcryptPasswordHasher,
    },
  ],
  exports: [
    RegisterUserUseCase,
    AuthenticateUserUseCase,
    JwtModule,
    RolesGuard,
  ],
})
export class IamModule {}