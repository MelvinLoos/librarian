import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { IBookFormatRepository } from '../ports/book-format-repository.interface';
import type { ConversionJobRepositoryInterface } from '../ports/conversion-job-repository.interface';

export interface RequestConversionCommand {
  bookId: number;
  targetFormat: string;
}

@Injectable()
export class RequestConversionUseCase {
  constructor(
    @Inject('IBookFormatRepository')
    private readonly bookFormatRepository: IBookFormatRepository,
    @Inject('IConversionJobRepository')
    private readonly conversionJobRepository: ConversionJobRepositoryInterface,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: RequestConversionCommand): Promise<string> {
    throw new Error('Not implemented');
  }
}