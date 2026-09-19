import { Inject, Injectable } from '@nestjs/common';
import type { CustomColumnRepositoryInterface } from '../ports/custom-column.repository.interface';

export interface DeleteCustomColumnCommand {
  id: string;
}

@Injectable()
export class DeleteCustomColumnUseCase {
  constructor(
    @Inject('ICustomColumnRepository')
    private readonly customColumnRepository: CustomColumnRepositoryInterface,
  ) {}

  async execute(command: DeleteCustomColumnCommand): Promise<boolean> {
    throw new Error('Not implemented');
  }
}