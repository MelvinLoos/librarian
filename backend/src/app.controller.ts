import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Public } from './iam/auth/public.decorator';

@ApiBearerAuth('JWT')
@Controller()
export class AppController {
  constructor() {}

  @Get('system/config')
  getConfig() {
    return {
      libraryPath: process.env.CALIBRE_LIBRARY_PATH || 'Not set',
    };
  }
}
