import { Body, Controller, Post } from '@nestjs/common';
import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import { RegisterUserDto } from './dto/register-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

  @Post()
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.registerUserUseCase.execute(registerUserDto);
  }
}
