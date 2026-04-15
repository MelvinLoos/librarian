import { Body, Controller, Post, HttpCode, HttpStatus, Res, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiOkResponse, ApiUnauthorizedResponse, ApiBadRequestResponse, ApiExtraModels } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthenticateUserUseCase } from '../application/use-cases/authenticate-user.use-case';
import { AuthService } from '../auth/auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { Public } from '../auth/public.decorator';

@ApiTags('Auth')
@ApiExtraModels(LoginResponseDto)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Login user', 
    description: 'Authenticates a user using email and password and returns a JWT access token together with authenticated user metadata.',
  })
  @ApiBody({ type: LoginDto, description: 'Login payload containing email and password.' })
  @ApiOkResponse({ type: LoginResponseDto, description: 'User successfully authenticated and JWT returned.' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password.' })
  @ApiBadRequestResponse({ description: 'Validation failed for login payload.' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authenticateUserUseCase.execute(loginDto);
    const { accessToken, refreshToken, user: userData } = this.authService.login(user);

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      accessToken,
      user: userData,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Refresh access token', 
    description: 'Uses the refreshToken from HttpOnly cookie to issue a new accessToken and a new refreshToken.',
  })
  @ApiOkResponse({ description: 'Tokens successfully refreshed.' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing refresh token.' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies['refreshToken'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    try {
      const payload = this.authService.verifyRefreshToken(refreshToken);
      const user = { id: payload.sub, email: payload.email, role: payload.role };
      const { accessToken, refreshToken: newRefreshToken } = this.authService.login(user as any);

      response.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return { accessToken };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}