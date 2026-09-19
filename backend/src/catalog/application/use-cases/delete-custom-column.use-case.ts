import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import type { CustomColumnRepositoryInterface } from '../ports/custom-column.repository.interface';

export interface DeleteCustomColumnCommand {
  id: string;
}

@Injectable()
export class DeleteCustomColumnUseCase {
  private readonly logger = new Logger(DeleteCustomColumnUseCase.name);

  constructor(
    @Inject('ICustomColumnRepository')
    private readonly customColumnRepository: CustomColumnRepositoryInterface,
  ) {}

  async execute(command: DeleteCustomColumnCommand): Promise<boolean> {
    const deleted = await this.customColumnRepository.deleteById(command.id);
    if (!deleted) {
      this.logger.warn(`Custom column ${command.id} not found`);
      throw new NotFoundException(`Custom column ${command.id} not found`);
    }
    this.logger.log(`Deleted custom column ${command.id}`);
    return true;
  }
}
