import { Inject, Injectable } from '@nestjs/common';
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
  constructor(
    @Inject('ICustomColumnRepository')
    private readonly customColumnRepository: CustomColumnRepositoryInterface,
  ) {}

  async execute(input: UpsertCustomColumnInput): Promise<CustomColumn> {
    throw new Error('Not implemented');
  }
}