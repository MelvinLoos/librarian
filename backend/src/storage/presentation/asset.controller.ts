import {
  Controller,
  Post,
  Get,
  Delete,
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
  NotFoundException,
  ParseIntPipe,
  StreamableFile,
  Header,
  Body,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UploadAssetUseCase } from '../application/use-cases/upload-asset.use-case';
import { StreamAssetUseCase } from '../application/use-cases/stream-asset.use-case';
import { DownloadAssetUseCase } from '../application/use-cases/download-asset.use-case';
import { GetAssetStatusUseCase } from '../application/use-cases/get-asset-status.use-case';
import { RequestConversionUseCase } from '../application/use-cases/request-conversion.use-case';
import {
  GetConversionStatusUseCase,
  ConversionStatusResult,
} from '../application/use-cases/get-conversion-status.use-case';
import { CancelConversionUseCase } from '../application/use-cases/cancel-conversion.use-case';
import { RequestConversionBody } from './dto/request-conversion.dto';
import { ConversionStatus } from '../domain/conversion-status.enum';
import { AssetStatusResult } from '../application/use-cases/get-asset-status.use-case';
import { AssetProcessingState } from '../domain/asset-processing-state.enum';

@ApiTags('Assets')
@ApiBearerAuth('JWT')
@Controller('assets')
export class AssetController {
  private readonly logger = new Logger(AssetController.name);

  constructor(
    private readonly uploadAssetUseCase: UploadAssetUseCase,
    private readonly streamAssetUseCase: StreamAssetUseCase,
    private readonly downloadAssetUseCase: DownloadAssetUseCase,
    private readonly getAssetStatusUseCase: GetAssetStatusUseCase,
    private readonly requestConversionUseCase: RequestConversionUseCase,
    private readonly getConversionStatusUseCase: GetConversionStatusUseCase,
    private readonly cancelConversionUseCase: CancelConversionUseCase,
  ) {}

  @Post('upload')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload an asset',
    description:
      'Uploads a file (e.g., EPUB, PDF, MOBI, image) to the storage and initiates metadata extraction asynchronously.',
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
  @ApiResponse({
    status: 202,
    description: 'Asset upload initiated successfully.',
  })
  @ApiResponse({ status: 400, description: 'File is required or invalid.' })
  async uploadFile(@UploadedFile() file: any) {
    // Note: 'any' is used here because Multer.File is not strictly available
    // without @types/multer which might not be global, but Nest uses it.

    if (!file) {
      this.logger.warn('Upload attempt failed: File is required');
      throw new BadRequestException('File is required');
    }

    this.logger.log(
      `Initiating upload for file: ${file.originalname} (size: ${file.size} bytes)`,
    );

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
      state: AssetProcessingState.UPLOADED,
      message: 'Asset upload initiated, metadata extraction will follow',
    };
  }

  @Get('books/:id/stream')
  @ApiOperation({
    summary: 'Stream a book file',
    description:
      'Streams a book file with HTTP 206 Partial Content support for chunked delivery.',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Book ID' })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Preferred format (e.g. EPUB, PDF)',
  })
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
      rangeHeader,
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
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Preferred format (e.g. EPUB, PDF)',
  })
  @ApiResponse({ status: 200, description: 'File download.' })
  async downloadBook(
    @Param('id', ParseIntPipe) id: number,
    @Query('format') format: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const result = await this.downloadAssetUseCase.execute({
      bookId: id,
      format,
    });

    res.set({
      'Content-Type': result.mimeType,
      'Content-Length': result.fileSize.toString(),
      'Content-Disposition': `attachment; filename="${result.fileName}"`,
    });

    return new StreamableFile(result.stream);
  }

  @Get(':id/status')
  @ApiOperation({
    summary: 'Get asset processing status',
    description:
      'Retrieves the current processing status of an asset by its ID.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Asset ID' })
  @ApiResponse({
    status: 200,
    description: 'Asset status retrieved successfully.',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Asset not found.' })
  async getAssetStatus(
    @Param('id') assetId: string,
  ): Promise<AssetStatusResult> {
    this.logger.log(`Received request for asset status: ${assetId}`);

    const status = await this.getAssetStatusUseCase.execute({ assetId });

    if (!status) {
      throw new NotFoundException(`Asset with ID ${assetId} not found.`);
    }

    return status;
  }

  @Post('books/:id/convert')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Request a format conversion',
    description:
      'Creates a ConversionJob and triggers the conversion pipeline asynchronously via the piscina worker pool.',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Book ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['targetFormat'],
      properties: {
        targetFormat: {
          type: 'string',
          example: 'MOBI',
          description: 'Target format (EPUB, PDF, MOBI, TXT, ...)',
        },
      },
    },
  })
  @ApiResponse({ status: 202, description: 'Conversion requested.' })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  @ApiResponse({ status: 400, description: 'Unsupported conversion pair.' })
  async requestConversion(
    @Param('id', ParseIntPipe) bookId: number,
    @Body() body: RequestConversionBody,
  ): Promise<{ jobId: string; message: string }> {
    this.logger.log(
      `Received conversion request for book ${bookId} -> ${body.targetFormat}`,
    );

    const jobId = await this.requestConversionUseCase.execute({
      bookId,
      targetFormat: body.targetFormat,
    });

    return { jobId, message: 'Conversion requested' };
  }

  @Get('conversions/:jobId')
  @ApiOperation({
    summary: 'Get conversion status',
    description: 'Returns the status and progress of a format conversion job.',
  })
  @ApiParam({ name: 'jobId', type: 'string', description: 'Conversion job ID' })
  @ApiResponse({
    status: 200,
    description: 'Conversion status retrieved successfully.',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Conversion job not found.' })
  async getConversionStatus(
    @Param('jobId') jobId: string,
  ): Promise<ConversionStatusResult> {
    this.logger.log(`Received status request for conversion job ${jobId}`);

    const status = await this.getConversionStatusUseCase.execute({ jobId });
    if (!status) {
      throw new NotFoundException(`Conversion job ${jobId} not found`);
    }

    return status;
  }

  @Delete('conversions/:jobId')
  @ApiOperation({
    summary: 'Cancel a conversion',
    description:
      'Cancels a pending or running conversion job and returns its updated status.',
  })
  @ApiParam({ name: 'jobId', type: 'string', description: 'Conversion job ID' })
  @ApiResponse({
    status: 200,
    description: 'Conversion cancelled successfully.',
  })
  @ApiResponse({ status: 404, description: 'Conversion job not found.' })
  @ApiResponse({
    status: 400,
    description: 'Job cannot be cancelled in its current state.',
  })
  async cancelConversion(
    @Param('jobId') jobId: string,
  ): Promise<{ jobId: string; status: ConversionStatus }> {
    this.logger.log(`Received cancel request for conversion job ${jobId}`);

    const job = await this.cancelConversionUseCase.execute({ jobId });

    return {
      jobId: job.props.id,
      status: job.props.status as ConversionStatus,
    };
  }
}
