import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { UploadAssetUseCase } from '../application/use-cases/upload-asset.use-case';

@ApiTags('Assets')
@ApiBearerAuth('JWT')
@Controller('assets')
export class AssetController {
  constructor(private readonly uploadAssetUseCase: UploadAssetUseCase) {}

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
      throw new Error('File is required');
    }

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
}