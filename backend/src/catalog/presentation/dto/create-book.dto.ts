import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  sortTitle?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  pubdate?: Date;

  @IsBoolean()
  @IsOptional()
  hasCover?: boolean;
}
