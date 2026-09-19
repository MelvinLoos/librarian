import { Inject, Injectable, Logger } from '@nestjs/common';
import { CustomColumn } from '../../domain/entities/custom-column.entity';
import type { CustomColumnRepositoryInterface } from '../ports/custom-column.repository.interface';

export interface UpsertCustomColumnInput {
  name: string;
  dataType?: string;
  displayLabel?: string;
  isMultiple?: boolean;
}

@Injectable()
export class UpsertCustomColumnUseCase {
  private readonly logger = new Logger(UpsertCustomColumnUseCase.name);

  constructor(
    @Inject('ICustomColumnRepository')
    private readonly customColumnRepository: CustomColumnRepositoryInterface,
  ) {}

  async execute(input: UpsertCustomColumnInput): Promise<CustomColumn> {
    // Entity constructor validates the datatype and name.
    const column = new CustomColumn({
      name: input.name,
      value: '',
      dataType: input.dataType as CustomColumn['props']['dataType'],
      displayLabel: input.displayLabel,
      isMultiple: input.isMultiple,
    });

    const saved = await this.customColumnRepository.upsert(column);
    this.logger.log(`Upserted custom column "${saved.props.name}"`);
    return saved;
  }
}
