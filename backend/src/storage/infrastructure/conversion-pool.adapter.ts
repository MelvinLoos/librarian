import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Piscina from 'piscina';
import { join } from 'path';
import {
  IConversionExecutor,
  ConversionJobInput,
} from '../application/ports/conversion-executor.interface';
import { ConversionWorkerResult } from './conversion.worker';

@Injectable()
export class ConversionPoolAdapter
  implements IConversionExecutor, OnModuleDestroy
{
  private piscina: Piscina;

  constructor() {
    const workerExtension = __filename.endsWith('.js') ? '.js' : '.ts';
    this.piscina = new Piscina({
      filename: join(__dirname, `conversion.worker${workerExtension}`),
      minThreads: 1,
      maxThreads: 2,
    });
  }

  async convert(input: ConversionJobInput): Promise<void> {
    const result: ConversionWorkerResult = await this.piscina.run(input);
    if (!result.success) {
      throw new Error(result.errorMessage ?? 'Format conversion failed');
    }
  }

  onModuleDestroy() {
    this.piscina.destroy();
  }
}
