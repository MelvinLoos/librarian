import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetTopTagsUseCase } from '../application/use-cases/get-top-tags.use-case';

@ApiTags('Explore')
@ApiBearerAuth('JWT')
@Controller('tags')
export class TagController {
  constructor(private readonly getTopTagsUseCase: GetTopTagsUseCase) {}

  @Get('top')
  @ApiOperation({ 
    summary: 'Get top tags', 
    description: 'Retrieves the top 15 tags sorted by the number of books associated with them.' 
  })
  @ApiResponse({ status: 200, description: 'Top tags retrieved successfully.' })
  async getTopTags() {
    return this.getTopTagsUseCase.execute();
  }
}