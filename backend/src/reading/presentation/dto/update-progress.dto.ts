import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

export class UpdateProgressDto {
  @ApiProperty({
    description: 'Format-agnostic reading position (EPUB CFI string or PDF page identifier)',
    example: 'epubcfi(/6/4!/4/2/1:0)',
  })
  @IsString()
  @IsNotEmpty()
  locator: string;

  @ApiProperty({
    description: 'Overall reading completion percentage (0.0 to 100.0)',
    example: 42.5,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;
}