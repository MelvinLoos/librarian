import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateProgressDto {
  @ApiProperty({ description: 'The page the user left off on', example: 42 })
  @IsInt()
  @Min(0)
  currentPage: number;

  @ApiProperty({ description: 'Total number of pages in the asset', example: 350 })
  @IsInt()
  @Min(1)
  totalPages: number;
}