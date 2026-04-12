import { Controller, Put, Get, Param, Body, ParseIntPipe, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UpdateReadingProgressUseCase } from '../application/use-cases/update-reading-progress.use-case';
import { GetReadingStatesUseCase } from '../application/use-cases/get-reading-states.use-case';
import { UpdateProgressDto } from './dto/update-progress.dto';
// import { JwtAuthGuard } from '../your-auth-guard-path'; // Implement based on your JWT setup

@ApiTags('User Progress')
@ApiBearerAuth()
@Controller('users/me')
// @UseGuards(JwtAuthGuard) // Uncomment once your JWT strategy is wired up!
export class ProgressController {
  constructor(
    private readonly updateReadingProgressUseCase: UpdateReadingProgressUseCase,
    private readonly getReadingStatesUseCase: GetReadingStatesUseCase,
  ) {}

  @Put('progress/:bookId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Update reading progress', 
    description: 'Upserts the user reading progress for a specific book.' 
  })
  @ApiParam({ name: 'bookId', type: 'number', description: 'The ID of the book being read' })
  @ApiResponse({ status: 200, description: 'Progress successfully saved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async updateProgress(
    @Request() req: any, 
    @Param('bookId', ParseIntPipe) bookId: number, 
    @Body() dto: UpdateProgressDto
  ) {
    // Assuming req.user is populated by your Auth Guard
    const userId = req.user?.id || 'TEST_USER_ID'; // Replace fallback once auth is active
    await this.updateReadingProgressUseCase.execute(userId, bookId, dto.currentPage, dto.totalPages);
    return { message: 'Progress updated' };
  }

  @Get('reading-states')
  @ApiOperation({ 
    summary: 'Get all reading states', 
    description: 'Retrieves all books currently being read by the authenticated user, sorted by recent activity.' 
  })
  @ApiResponse({ status: 200, description: 'Reading states retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getStates(@Request() req: any) {
    const userId = req.user?.id || 'TEST_USER_ID'; // Replace fallback once auth is active
    return this.getReadingStatesUseCase.execute(userId);
  }
}