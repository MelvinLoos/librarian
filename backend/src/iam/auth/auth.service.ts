import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticateUserResponse } from '../application/use-cases/authenticate-user.use-case';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  login(user: AuthenticateUserResponse) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }
}
