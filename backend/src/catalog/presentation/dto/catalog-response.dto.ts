import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Canonical response DTOs shared by the book read, edit, and bulk flows.
 *
 * Guarantees byte-for-byte identical JSON between `GET /books/:id`,
 * `PATCH /books/:id`, and `PATCH /books/bulk` so that an edited book
 * "survives a page refresh" — the exact fields the edit flows accept must be
 * the fields the read flows return.
 */
export class TagResponseDto {
  @ApiPropertyOptional({ description: 'Internal record id', example: '3' })
  id?: string;

  @ApiProperty({ description: 'Tag name', example: 'Fantasy' })
  name: string;
}

export class AuthorResponseDto {
  @ApiPropertyOptional({ description: 'Internal record id', example: '2' })
  id?: string;

  @ApiProperty({ description: 'Author name', example: 'Brandon Sanderson' })
  name: string;
}

export class SeriesResponseDto {
  @ApiPropertyOptional({ description: 'Internal record id', example: '1' })
  id?: string;

  @ApiProperty({
    description: 'Series name',
    example: 'The Stormlight Archive',
  })
  name: string;

  @ApiPropertyOptional({ description: 'Index within the series', example: 1 })
  index?: number;
}

export class IdentifierResponseDto {
  @ApiProperty({ description: 'Identifier type', example: 'isbn' })
  type: string;

  @ApiProperty({ description: 'Identifier value', example: '9780765326355' })
  value: string;
}

export class CanonicalBookResponseDto {
  @ApiProperty({ description: 'Legacy Calibre book id', example: '123' })
  id: string;

  @ApiProperty({ description: 'Book title', example: 'The Way of Kings' })
  title: string;

  @ApiPropertyOptional({
    description: 'Sorting title',
    example: 'Way of Kings, The',
  })
  sortTitle?: string;

  @ApiPropertyOptional({
    description: 'Date of publication',
    example: '2010-08-31T00:00:00.000Z',
  })
  pubdate?: Date;

  @ApiPropertyOptional({
    description: 'Whether the book has a cover',
    example: true,
  })
  hasCover?: boolean;

  @ApiPropertyOptional({ description: 'Available file formats' })
  formats?: unknown[];

  @ApiPropertyOptional({
    description: 'Book description / summary',
    example: 'An epic fantasy novel.',
  })
  description?: string;

  @ApiPropertyOptional({ description: 'Publisher name', example: 'Tor Books' })
  publisher?: string;

  @ApiPropertyOptional({
    description: 'User rating between 0 and 5',
    example: 4.5,
  })
  rating?: number;

  @ApiPropertyOptional({ description: 'Series information' })
  series?: SeriesResponseDto;

  @ApiPropertyOptional({
    description: 'Authors of the book',
    type: [AuthorResponseDto],
  })
  authors?: AuthorResponseDto[];

  @ApiPropertyOptional({
    description: 'Tags of the book',
    type: [TagResponseDto],
  })
  tags?: TagResponseDto[];

  @ApiPropertyOptional({
    description: 'Custom identifiers (e.g., ISBN)',
    type: [IdentifierResponseDto],
  })
  identifiers?: IdentifierResponseDto[];
}
