import { Controller, Put, Get, Param, Body, ParseIntPipe, Request, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UpdateReadingProgressUseCase } from '../application/use-cases/update-reading-progress.use-case';
import { GetReadingStatesUseCase } from '../application/use-cases/get-reading-states.use-case';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { RolesGuard } from '../../iam/auth/roles.guard';
import { Roles } from '../../iam/auth/roles.decorator';
import { Role } from '../../iam/auth/roles.enum';

@ApiTags('User Progress')
@ApiBearerAuth('JWT')
@UseGuards(RolesGuard)
@Controller('users/me')
export class ProgressController {
  private readonly logger = new Logger(ProgressController.name);

  constructor(
    private readonly updateReadingProgressUseCase: UpdateReadingProgressUseCase,
    private readonly getReadingStatesUseCase: GetReadingStatesUseCase,
  ) { }

  @Put('progress/:bookId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update reading progress',
    description: 'Upserts the user reading progress for a specific book.'
  })
  @ApiParam({ name: 'bookId', type: 'number', description: 'The ID of the book being read' })
  @ApiResponse({ status: 200, description: 'Progress successfully saved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Roles(Role.READER, Role.ADMIN)
  async updateProgress(
    @Request() req: any,
    @Param('bookId', ParseIntPipe) bookId: number,
    @Body() dto: UpdateProgressDto,
  ) {
    const userId = req.user?.id;
    this.logger.log(`Received request to update progress for user: ${userId}, book: ${bookId} to locator ${dto.locator}, percentage ${dto.percentage}`);
    await this.updateReadingProgressUseCase.execute(userId, bookId, dto.locator, dto.percentage);
    return { message: 'Progress updated' };
  }

  @Get('reading-states')
  @Roles(Role.READER, Role.ADMIN)
  @ApiOperation({
    summary: 'Get all reading states',
    description: 'Retrieves all books currently being read by the authenticated user, sorted by recent activity.'
  })
  @ApiResponse({ status: 200, description: 'Reading states retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getStates(@Request() req: any) {
    const userId = req.user?.id;
    this.logger.log(`Received request to get reading states for user: ${userId}`);
    return this.getReadingStatesUseCase.execute(userId);
  }
}