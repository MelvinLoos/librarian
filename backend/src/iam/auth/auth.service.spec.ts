import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    jwtService = {
      sign: jest.fn().mockReturnValue('signed.jwt.token'),
    } as any;
    service = new AuthService(jwtService);
  });

  it('should sign a JWT with user payload', () => {
    const user = {
      id: 'user-id',
      email: 'user@example.com',
      role: 'READER',
    };

    const result = service.login(user);

    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    expect(result).toEqual({
      accessToken: 'signed.jwt.token',
      user,
    });
  });
});
