import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetAllSeriesUseCase } from '../application/use-cases/get-all-series.use-case';

@ApiTags('Explore')
@ApiBearerAuth('JWT')
@Controller('series')
export class SeriesController {
  constructor(private readonly getAllSeriesUseCase: GetAllSeriesUseCase) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get all series', 
    description: 'Retrieves a simple alphabetical list of all series.' 
  })
  @ApiResponse({ status: 200, description: 'Series retrieved successfully.' })
  async findAll() {
    return this.getAllSeriesUseCase.execute();
  }
}