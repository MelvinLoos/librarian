import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './iam/auth/public.decorator';

@ApiBearerAuth('JWT')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('system/config')
  getConfig() {
    return {
      libraryPath: process.env.CALIBRE_LIBRARY_PATH || 'Not set',
    };
  }
}
