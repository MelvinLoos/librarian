import { IsNotEmpty, IsString } from 'class-validator';

export class RequestConversionBody {
  @IsString()
  @IsNotEmpty()
  targetFormat: string;
}
