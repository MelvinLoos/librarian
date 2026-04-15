import { Controller, Get, Param, ParseIntPipe, StreamableFile, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AssetService } from './asset.service';
import { Public } from '../iam/auth/public.decorator';
import type { Response } from 'express';

@ApiTags('Assets')
@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Public()
  @Get('covers/:bookId')
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
  async getCover(
    @Param('bookId', ParseIntPipe) bookId: number,
    @Res({ passthrough: true }) res: Response
  ): Promise<StreamableFile> {
    const stream = await this.assetService.getCoverStream(bookId);
    res.set({
      'Content-Type': 'image/jpeg',
    });
    return new StreamableFile(stream);
  }
}