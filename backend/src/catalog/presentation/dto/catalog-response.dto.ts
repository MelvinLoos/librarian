import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Canonical Catalog Response DTOs (DTO Purity Mandate).
 *
 * These types define the EXACT wire contract served by every book endpoint.
 * Domain aggregates (`_id`, `props`) MUST NEVER appear here - only flat
 * primitives. GET /books/:id, PATCH /books/:id and PATCH /books/bulk all
 * emit the canonical shape below.
 */

export class TagResponseDto {
  @ApiProperty({ description: 'Stable tag identifier', example: '7' })
  id: string;

  @ApiProperty({ description: 'Tag display name', example: 'Fiction' })
  name: string;
}

export class AuthorResponseDto {
  @ApiProperty({ description: 'Stable author identifier', example: '5' })
  id: string;

  @ApiProperty({ description: 'Author name', example: 'Brandon Sanderson' })
  name: string;
}

export class SeriesResponseDto {
  @ApiProperty({ description: 'Stable series identifier', example: '3' })
  id: string;

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

  @ApiProperty({
    description: 'Identifier value',
    example: '9780765326355',
  })
  value: string;
}

export class FormatResponseDto {
  @ApiProperty({ description: 'File format extension', example: 'EPUB' })
  format: string;

  @ApiProperty({
    description: 'Uncompressed byte size',
    example: 512000,
  })
  uncompressedSize: number;

  @ApiProperty({
    description: 'Physical file name',
    example: 'way_of_kings.epub',
  })
  name: string;
}

/**
 * Canonical book response.
 *
 * The "edit" subset (id through authors) is identical for single-book edits
 * and bulk updates. Read-context extras (sortTitle, pubdate, hasCover,
 * formats) are populated by GET /books/:id only.
 */
export class CanonicalBookResponseDto {
  @ApiProperty({ description: 'Book identifier', example: '1' })
  id: string;

  @ApiProperty({ description: 'Book title', example: 'The Way of Kings' })
  title: string;

  @ApiPropertyOptional({ description: 'Publisher name', example: 'Tor Books' })
  publisher?: string;

  @ApiPropertyOptional({ description: 'Rating on a 0-5 scale', example: 4.5 })
  rating?: number;

  @ApiPropertyOptional({
    description: 'Series membership',
    type: SeriesResponseDto,
  })
  series?: SeriesResponseDto;

  @ApiProperty({
    description: 'Tags applied to the book',
    type: [TagResponseDto],
  })
  tags: TagResponseDto[];

  @ApiProperty({
    description: 'External identifiers (ISBN, ASIN...)',
    type: [IdentifierResponseDto],
  })
  identifiers: IdentifierResponseDto[];

  @ApiPropertyOptional({
    description: 'Book description',
    example: 'An epic fantasy novel.',
  })
  description?: string;

  @ApiProperty({
    description: 'Authors of the book',
    type: [AuthorResponseDto],
  })
  authors: AuthorResponseDto[];

  // ── Read-context extras (GET /books/:id only) ──────────────────────────

  @ApiPropertyOptional({
    description: 'Sorting title',
    example: 'Way of Kings, The',
  })
  sortTitle?: string;

  @ApiPropertyOptional({ description: 'Publication date' })
  pubdate?: Date;

  @ApiPropertyOptional({
    description: 'Whether a cover is available',
    example: true,
  })
  hasCover?: boolean;

  @ApiPropertyOptional({
    description: 'Available file formats',
    type: [FormatResponseDto],
  })
  formats?: FormatResponseDto[];
}
