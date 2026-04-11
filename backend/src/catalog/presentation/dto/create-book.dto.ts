import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({ description: 'The title of the book', example: 'The Silmarillion' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'The sorting title of the book', example: 'Silmarillion, The' })
  @IsString()
  @IsOptional()
  sortTitle?: string;

  @ApiPropertyOptional({ description: 'The publication date of the book', example: '1977-09-15T00:00:00.000Z' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  pubdate?: Date;

  @ApiPropertyOptional({ description: 'Indicates whether the book has a cover image', example: true })
  @IsBoolean()
  @IsOptional()
  hasCover?: boolean;
}