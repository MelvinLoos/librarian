import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { IUserRepository } from '../application/ports/user.repository.interface';
import { JwtPayload } from './jwt-payload.interface';

// 1. Create a custom extractor that looks for the Nuxt cookie
const cookieExtractor = (req: Request) => {
  let token = null;
  // ONLY accept cookie authentication for safe GET requests (like our media streams)
  if (req && req.method === 'GET' && req.cookies) {
    token = req.cookies['auth_token'];
  }
  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {
    super({
      // 2. Tell Passport to check the Header first, then the Cookie
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}