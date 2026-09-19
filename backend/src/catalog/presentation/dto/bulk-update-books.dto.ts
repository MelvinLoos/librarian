import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  ArrayMinSize,
  IsInt,
  Min,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateBookMetadataDto } from './update-book-metadata.dto';

export class BulkUpdateBooksDto {
  @ApiProperty({
    description: 'Book IDs to update',
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  bookIds: number[];

  @ApiPropertyOptional({
    description: 'Partial metadata changes applied to every book',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateBookMetadataDto)
  changes: UpdateBookMetadataDto;
}
