import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiOkResponse, ApiUnauthorizedResponse, ApiBadRequestResponse, ApiExtraModels } from '@nestjs/swagger';
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
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authenticateUserUseCase.execute(loginDto);
    return this.authService.login(user);
  }
}