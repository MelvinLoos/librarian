import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpsertCustomColumnDto {
  @ApiProperty({ description: 'Custom column name (e.g. #read_status)', example: '#read_status' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Column datatype',
    enum: ['text', 'series', 'number', 'rating', 'date', 'boolean'],
    default: 'text',
  })
  @IsOptional()
  @IsIn(['text', 'series', 'number', 'rating', 'date', 'boolean'])
  dataType?: string;

  @ApiPropertyOptional({ description: 'Human friendly display label', example: 'Read Status' })
  @IsOptional()
  @IsString()
  displayLabel?: string;

  @ApiPropertyOptional({ description: 'Whether the column accepts multiple values', default: false })
  @IsOptional()
  @IsBoolean()
  isMultiple?: boolean;
}