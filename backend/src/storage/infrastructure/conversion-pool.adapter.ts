import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Piscina from 'piscina';
import { join } from 'path';
import type { IConversionExecutor, ConversionJobInput } from '../application/ports/conversion-executor.interface';

@Injectable()
export class ConversionPoolAdapter
  implements IConversionExecutor, OnModuleDestroy
{
  private piscina: Piscina;

  constructor() {
    this.piscina = new Piscina({
      filename: join(
        __dirname,
        `conversion.worker${require('path').extname(__filename)}`,
      ),
      minThreads: 1,
      maxThreads: 2,
    });
  }

  async convert(input: ConversionJobInput): Promise<void> {
    throw new Error('Not implemented');
  }

  onModuleDestroy() {
    this.piscina.destroy();
  }
}