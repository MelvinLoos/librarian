import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Headers,
  Res,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  ParseIntPipe,
  StreamableFile,
  Header
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { UploadAssetUseCase } from '../application/use-cases/upload-asset.use-case';
import { StreamAssetUseCase } from '../application/use-cases/stream-asset.use-case';
import { DownloadAssetUseCase } from '../application/use-cases/download-asset.use-case';

@ApiTags('Assets')
@ApiBearerAuth('JWT')
@Controller('assets')
export class AssetController {
  private readonly logger = new Logger(AssetController.name);

  constructor(
    private readonly uploadAssetUseCase: UploadAssetUseCase,
    private readonly streamAssetUseCase: StreamAssetUseCase,
    private readonly downloadAssetUseCase: DownloadAssetUseCase,
  ) { }

  @Post('upload')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload an asset',
    description: 'Uploads a file (e.g., EPUB, PDF, MOBI, image) to the storage and initiates metadata extraction asynchronously.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The file to be uploaded',
        },
      },
    },
  })
  @ApiResponse({ status: 202, description: 'Asset upload initiated successfully.' })
  @ApiResponse({ status: 400, description: 'File is required or invalid.' })
  async uploadFile(@UploadedFile() file: any) {
    // Note: 'any' is used here because Multer.File is not strictly available 
    // without @types/multer which might not be global, but Nest uses it.

    if (!file) {
      this.logger.warn('Upload attempt failed: File is required');
      throw new BadRequestException('File is required');
    }

    this.logger.log(`Initiating upload for file: ${file.originalname} (size: ${file.size} bytes)`);

    const assetId = await this.uploadAssetUseCase.execute({
      file: {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    });

    return {
      id: assetId,
      message: 'Asset upload initiated',
    };
  }

  @Get('books/:id/stream')
  @ApiOperation({
    summary: 'Stream a book file',
    description: 'Streams a book file with HTTP 206 Partial Content support for chunked delivery.',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Book ID' })
  @ApiQuery({ name: 'format', required: false, description: 'Preferred format (e.g. EPUB, PDF)' })
  @ApiResponse({ status: 200, description: 'Full file stream.' })
  @ApiResponse({ status: 206, description: 'Partial content stream.' })
  @Header('Accept-Ranges', 'bytes')
  async streamBook(
    @Param('id', ParseIntPipe) id: number,
    @Query('format') format: string | undefined,
    @Headers('range') rangeHeader: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const result = await this.streamAssetUseCase.execute({
      bookId: id,
      format,
      rangeHeader
    });

    if (rangeHeader) {
      // Set 206 Partial Content status
      res.status(HttpStatus.PARTIAL_CONTENT);
      res.set({
        'Content-Range': `bytes ${result.start}-${result.end}/${result.fileSize}`,
        'Content-Length': result.contentLength.toString(),
        'Content-Type': result.mimeType,
      });
    } else {
      res.set({
        'Content-Length': result.fileSize.toString(),
        'Content-Type': result.mimeType,
      });
    }

    return new StreamableFile(result.stream);
  }

  @Get('books/:id/download')
  @ApiOperation({
    summary: 'Download a book file',
    description: 'Downloads the full book file as an attachment.',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Book ID' })
  @ApiQuery({ name: 'format', required: false, description: 'Preferred format (e.g. EPUB, PDF)' })
  @ApiResponse({ status: 200, description: 'File download.' })
  async downloadBook(
    @Param('id', ParseIntPipe) id: number,
    @Query('format') format: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const result = await this.downloadAssetUseCase.execute({ bookId: id, format });

    res.set({
      'Content-Type': result.mimeType,
      'Content-Length': result.fileSize.toString(),
      'Content-Disposition': `attachment; filename="${result.fileName}"`,
    });

    return new StreamableFile(result.stream);
  }
}