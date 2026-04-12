import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SharedModule } from '../shared/shared.module';

// Controllers
import { UserController } from './presentation/user.controller';
import { AuthController } from './presentation/auth.controller';
import { ProgressController } from './presentation/progress.controller';

// Use Cases
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { AuthenticateUserUseCase } from './application/use-cases/authenticate-user.use-case';
import { UpdateReadingProgressUseCase } from './application/use-cases/update-reading-progress.use-case';
import { GetReadingStatesUseCase } from './application/use-cases/get-reading-states.use-case';

// Ports
import { IUserRepository } from './application/ports/user.repository.interface';
import { IPasswordHasher } from './application/ports/password-hasher.interface';

// Infrastructure Adapters
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password.hasher';
import { PrismaReadingProgressRepository } from './infrastructure/prisma-reading-progress.repository';

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
    ProgressController,
  ],
  providers: [
    // Application Use Cases
    RegisterUserUseCase,
    AuthenticateUserUseCase,
    UpdateReadingProgressUseCase,
    GetReadingStatesUseCase,

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
    {
      provide: 'IReadingProgressRepository',
      useClass: PrismaReadingProgressRepository,
    },
  ],
  exports: [
    RegisterUserUseCase,
    AuthenticateUserUseCase,
    UpdateReadingProgressUseCase,
    GetReadingStatesUseCase,
  ],
})
export class IamModule {}