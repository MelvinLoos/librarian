import { Inject, Injectable, Logger } from '@nestjs/common';
import { CustomColumn } from '../../domain/entities/custom-column.entity';
import type { CustomColumnRepositoryInterface } from '../ports/custom-column.repository.interface';

@Injectable()
export class GetCustomColumnsUseCase {
  private readonly logger = new Logger(GetCustomColumnsUseCase.name);

  constructor(
    @Inject('ICustomColumnRepository')
    private readonly customColumnRepository: CustomColumnRepositoryInterface,
  ) {}

  async execute(): Promise<CustomColumn[]> {
    const columns = await this.customColumnRepository.findAll();
    this.logger.log(`Returning ${columns.length} custom column(s)`);
    return columns;
  }
}
