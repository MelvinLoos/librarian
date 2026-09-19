import { Inject, Injectable } from '@nestjs/common';
import { CustomColumn } from '../../domain/entities/custom-column.entity';
import type { CustomColumnRepositoryInterface } from '../ports/custom-column.repository.interface';

@Injectable()
export class GetCustomColumnsUseCase {
  constructor(
    @Inject('ICustomColumnRepository')
    private readonly customColumnRepository: CustomColumnRepositoryInterface,
  ) {}

  async execute(): Promise<CustomColumn[]> {
    throw new Error('Not implemented');
  }
}