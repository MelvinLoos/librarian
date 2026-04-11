import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import { RegisterUserDto } from './dto/register-user.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

  @Post()
  @ApiOperation({ 
    summary: 'Register a new user', 
    description: 'Registers a new user in the system.' 
  })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 409, description: 'User already exists with this email.' })
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.registerUserUseCase.execute(registerUserDto);
  }
}