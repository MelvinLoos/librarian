import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ 
    description: 'The email address of the user', 
    example: 'reader@example.com' 
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    description: 'The password of the user', 
    example: 'securePassword123' 
  })
  @IsNotEmpty()
  password: string;
}