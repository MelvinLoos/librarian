import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { ConversionJobRepositoryInterface } from '../ports/conversion-job-repository.interface';
import type { IConversionExecutor } from '../ports/conversion-executor.interface';

export interface ExecuteConversionJobCommand {
  jobId: string;
  sourceAbsolutePath: string;
  outputRelativePath: string;
}

@Injectable()
export class ExecuteConversionJobUseCase {
  constructor(
    @Inject('IConversionJobRepository')
    private readonly conversionJobRepository: ConversionJobRepositoryInterface,
    @Inject('IConversionExecutor')
    private readonly conversionExecutor: IConversionExecutor,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: ExecuteConversionJobCommand): Promise<void> {
    throw new Error('Not implemented');
  }
}