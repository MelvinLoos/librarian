import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetAllAuthorsUseCase } from '../application/use-cases/get-all-authors.use-case';

@ApiTags('Explore')
@ApiBearerAuth('JWT')
@Controller('authors')
export class AuthorController {
  constructor(private readonly getAllAuthorsUseCase: GetAllAuthorsUseCase) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get all authors', 
    description: 'Retrieves a simple alphabetical list of all authors.' 
  })
  @ApiResponse({ status: 200, description: 'Authors retrieved successfully.' })
  async findAll() {
    return this.getAllAuthorsUseCase.execute();
  }
}