import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthenticateUserUseCase } from '../application/use-cases/authenticate-user.use-case';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authenticateUserUseCase: AuthenticateUserUseCase) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authenticateUserUseCase.execute(loginDto);
  }
}
