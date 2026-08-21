import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAuthorDto {
  @ApiPropertyOptional({
    description: 'Author name',
    example: 'Brandon Sanderson',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Author sort key',
    example: 'Sanderson, Brandon',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: 'Author link',
    example: 'brandon-sanderson',
  })
  @IsOptional()
  @IsString()
  link?: string;
}

export class UpdateTagDto {
  @ApiPropertyOptional({ description: 'Tag name', example: 'Fantasy' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateSeriesDto {
  @ApiPropertyOptional({
    description: 'Series name',
    example: 'The Stormlight Archive',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Index within the series', example: 1 })
  @IsOptional()
  @IsNumber()
  index?: number;
}

export class UpdateIdentifierDto {
  @ApiPropertyOptional({ description: 'Identifier type', example: 'isbn' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({
    description: 'Identifier value',
    example: '9780765326355',
  })
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class UpdateBookMetadataDto {
  @ApiPropertyOptional({
    description: 'The title of the book',
    example: 'The Way of Kings',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({
    description: 'Sorting title',
    example: 'Way of Kings, The',
  })
  @IsOptional()
  @IsString()
  sortTitle?: string;

  @ApiPropertyOptional({
    description: 'Author sort string',
    example: 'Sanderson, Brandon',
  })
  @IsOptional()
  @IsString()
  authorSort?: string;

  @ApiPropertyOptional({
    description: 'Book description / summary',
    example: 'An epic fantasy novel.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Publisher name', example: 'Tor Books' })
  @IsOptional()
  @IsString()
  publisher?: string;

  @ApiPropertyOptional({
    description: 'User rating between 0 and 5',
    example: 4.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ type: [UpdateAuthorDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAuthorDto)
  authors?: UpdateAuthorDto[];

  @ApiPropertyOptional({ type: [UpdateTagDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTagDto)
  tags?: UpdateTagDto[];

  @ApiPropertyOptional({ type: UpdateSeriesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateSeriesDto)
  series?: UpdateSeriesDto;

  @ApiPropertyOptional({ type: [UpdateIdentifierDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateIdentifierDto)
  identifiers?: UpdateIdentifierDto[];
}
