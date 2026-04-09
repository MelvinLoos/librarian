import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadAssetUseCase } from '../application/use-cases/upload-asset.use-case';

@Controller('assets')
export class AssetController {
  constructor(private readonly uploadAssetUseCase: UploadAssetUseCase) {}

  @Post('upload')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file'))
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
