import { Body, Controller, Post, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import { RegisterUserDto } from './dto/register-user.dto';
import { Public } from '../auth/public.decorator';

@ApiTags('Users')
@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

  @Public()
  @Post()
  @ApiOperation({ 
    summary: 'Register a new user', 
    description: 'Registers a new user in the system.' 
  })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 409, description: 'User already exists with this email.' })
  async register(@Body() registerUserDto: RegisterUserDto) {
    try {
      return await this.registerUserUseCase.execute(registerUserDto);
    } catch (error) {
      if ((error as any)?.status >= 400 && (error as any)?.status < 500) {
        throw error;
      }
      this.logger.error('Unexpected error during user registration', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}