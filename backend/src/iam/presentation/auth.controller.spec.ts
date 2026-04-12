import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthenticateUserUseCase } from '../application/use-cases/authenticate-user.use-case';
import { AuthService } from '../auth/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authenticateUserUseCase: jest.Mocked<AuthenticateUserUseCase>;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    authenticateUserUseCase = {
      execute: jest.fn(),
    } as any;
    authService = {
      login: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthenticateUserUseCase, useValue: authenticateUserUseCase },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should return a signed JWT on successful login', async () => {
    const loginDto = { email: 'user@example.com', password: 'password123' };
    const user = { id: 'user-id', email: loginDto.email, role: 'READER' };
    const tokenResponse = { accessToken: 'signed.jwt.token', user };

    authenticateUserUseCase.execute.mockResolvedValue(user);
    authService.login.mockReturnValue(tokenResponse);

    const result = await controller.login(loginDto);

    expect(authenticateUserUseCase.execute).toHaveBeenCalledWith(loginDto);
    expect(authService.login).toHaveBeenCalledWith(user);
    expect(result).toEqual(tokenResponse);
  });
});
