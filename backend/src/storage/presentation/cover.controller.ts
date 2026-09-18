import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { GetCoverStreamUseCase } from '../application/use-cases/get-cover-stream.use-case';
import { Public } from '../../shared/decorators/public.decorator';

@ApiTags('Assets')
@Controller('assets')
export class CoverController {
  constructor(private readonly getCoverStreamUseCase: GetCoverStreamUseCase) {}

  @Public()
  @Get('covers/:bookId')
  @ApiOperation({
    summary: 'Stream book cover',
    description:
      'Retrieves the physical cover.jpg file from the Calibre library and streams it back to the client.',
  })
  @ApiParam({
    name: 'bookId',
    type: 'number',
    description: 'The unique ID of the book in the legacy database',
    example: 123,
  })
  @ApiResponse({ status: 200, description: 'Streamable cover image.' })
  @ApiResponse({
    status: 404,
    description: 'Book record missing or file not found on disk.',
  })
  async getCover(
    @Param('bookId', ParseIntPipe) bookId: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const stream = await this.getCoverStreamUseCase.execute(bookId);
    res.set({
      'Content-Type': 'image/jpeg',
    });
    return new StreamableFile(stream);
  }
}
