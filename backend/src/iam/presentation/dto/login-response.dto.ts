import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({
    description: 'Unique user identifier',
    example: 'user-123',
  })
  id: string;

  @ApiProperty({
    description: 'Authenticated user email address',
    example: 'reader@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Assigned role for the authenticated user',
    example: 'READER',
  })
  role: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token used for authenticated API requests',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    type: AuthUserDto,
    description: 'Authenticated user metadata returned with the token',
  })
  user: AuthUserDto;
}
