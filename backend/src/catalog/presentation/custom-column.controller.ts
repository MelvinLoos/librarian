import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { GetCustomColumnsUseCase } from '../application/use-cases/get-custom-columns.use-case';
import { UpsertCustomColumnUseCase } from '../application/use-cases/upsert-custom-column.use-case';
import { DeleteCustomColumnUseCase } from '../application/use-cases/delete-custom-column.use-case';
import { UpsertCustomColumnDto } from './dto/upsert-custom-column.dto';

@ApiTags('Custom Columns')
@ApiBearerAuth('JWT')
@Controller('custom-columns')
export class CustomColumnController {
  private readonly logger = new Logger(CustomColumnController.name);

  constructor(
    private readonly getCustomColumnsUseCase: GetCustomColumnsUseCase,
    private readonly upsertCustomColumnUseCase: UpsertCustomColumnUseCase,
    private readonly deleteCustomColumnUseCase: DeleteCustomColumnUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List custom columns',
    description: 'Returns all custom column definitions.',
  })
  @ApiResponse({ status: 200, description: 'Custom columns retrieved.' })
  async listColumns() {
    throw new Error('Not implemented');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create or update a custom column',
    description: 'Creates a new custom column definition or upserts an existing one by name.',
  })
  @ApiResponse({ status: 201, description: 'Custom column saved.' })
  @ApiResponse({ status: 400, description: 'Invalid payload.' })
  async upsertColumn(@Body() dto: UpsertCustomColumnDto) {
    throw new Error('Not implemented');
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a custom column',
    description: 'Deletes a custom column definition by its id.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Custom column id' })
  @ApiResponse({ status: 200, description: 'Custom column deleted.' })
  @ApiResponse({ status: 404, description: 'Custom column not found.' })
  async deleteColumn(@Param('id') id: string) {
    throw new Error('Not implemented');
  }
}