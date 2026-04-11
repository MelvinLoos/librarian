import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({ 
    description: 'The email address for the new user', 
    example: 'newuser@example.com' 
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    description: 'The password for the new user (minimum 8 characters)', 
    example: 'securePassword123' 
  })
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}