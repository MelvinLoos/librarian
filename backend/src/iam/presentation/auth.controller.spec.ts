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

  it('should return a signed JWT and set cookie on successful login', async () => {
    const loginDto = { email: 'user@example.com', password: 'password123' };
    const user = { id: 'user-id', email: loginDto.email, role: 'READER' };
    const tokenResponse = { accessToken: 'signed.jwt.token', refreshToken: 'refresh.token', user };
    const mockResponse = { cookie: jest.fn() } as any;

    authenticateUserUseCase.execute.mockResolvedValue(user);
    authService.login.mockReturnValue(tokenResponse);

    const result = await controller.login(loginDto, mockResponse);

    expect(authenticateUserUseCase.execute).toHaveBeenCalledWith(loginDto);
    expect(authService.login).toHaveBeenCalledWith(user);
    expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'refresh.token', expect.any(Object));
    expect(result).toEqual({ accessToken: 'signed.jwt.token', user });
  });

  it('should refresh tokens when valid refresh token is provided', async () => {
    const mockRequest = { cookies: { refreshToken: 'valid.refresh.token' } } as any;
    const mockResponse = { cookie: jest.fn() } as any;
    const payload = { sub: 'user-id', email: 'user@example.com', role: 'READER' };
    const newTokenResponse = { accessToken: 'new.access.token', refreshToken: 'new.refresh.token' };

    authService.verifyRefreshToken = jest.fn().mockReturnValue(payload);
    authService.login.mockReturnValue(newTokenResponse as any);

    const result = await controller.refresh(mockRequest, mockResponse);

    expect(authService.verifyRefreshToken).toHaveBeenCalledWith('valid.refresh.token');
    expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'new.refresh.token', expect.any(Object));
    expect(result).toEqual({ accessToken: 'new.access.token' });
  });

  it('should throw UnauthorizedException when refresh token is missing', async () => {
    const mockRequest = { cookies: {} } as any;
    const mockResponse = {} as any;

    await expect(controller.refresh(mockRequest, mockResponse)).rejects.toThrow('Refresh token missing');
  });
});
