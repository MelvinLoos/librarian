import { Controller, Get, Param, ParseIntPipe, StreamableFile, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AssetService } from './asset.service';
import { Public } from '../iam/auth/public.decorator';

@ApiTags('Assets')
@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Public()
  @Get('covers/:bookId')
  @Header('Content-Type', 'image/jpeg')
  @ApiOperation({ 
    summary: 'Stream book cover', 
    description: 'Retrieves the physical cover.jpg file from the Calibre library and streams it back to the client.' 
  })
  @ApiParam({ 
    name: 'bookId', 
    type: 'number', 
    description: 'The unique ID of the book in the legacy database', 
    example: 123 
  })
  @ApiResponse({ status: 200, description: 'Streamable cover image.' })
  @ApiResponse({ status: 404, description: 'Book record missing or file not found on disk.' })
  async getCover(@Param('bookId', ParseIntPipe) bookId: number): Promise<StreamableFile> {
    const stream = await this.assetService.getCoverStream(bookId);
    return new StreamableFile(stream);
  }
}