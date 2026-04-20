import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Piscina from 'piscina';
import { join } from 'path';
import { MetadataExtractionResult } from './metadata-extraction.types';

@Injectable()
export class MetadataExtractionPoolAdapter implements OnModuleDestroy {
  private piscina: Piscina;

  constructor() {
    this.piscina = new Piscina({
      filename: join(__dirname, `metadata-extractor.worker${require('path').extname(__filename)}`),
      minThreads: 1,
      maxThreads: 2,
    });
  }

  async extractMetadata(filePath: string): Promise<{ title: string; author: string } | null> {
    const result: MetadataExtractionResult = await this.piscina.run(filePath);
    if (result.success) {
      return result.metadata!;
    } else {
      throw new Error(result.reason);
    }
  }

  onModuleDestroy() {
    this.piscina.destroy();
  }
}
