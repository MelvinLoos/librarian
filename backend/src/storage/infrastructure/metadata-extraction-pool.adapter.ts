import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Piscina from 'piscina';
import { join } from 'path';
import { MetadataExtractionResult } from './metadata-extraction.types';
import { ExtractedMetadata } from '../domain/value-objects/extracted-metadata.value-object';
import { IMetadataExtractor } from '../application/ports/metadata-extractor.interface';

@Injectable()
export class MetadataExtractionPoolAdapter
  implements IMetadataExtractor, OnModuleDestroy
{
  private piscina: Piscina;

  constructor() {
    this.piscina = new Piscina({
      filename: join(
        __dirname,
        `metadata-extractor.worker${require('path').extname(__filename)}`,
      ),
      minThreads: 1,
      maxThreads: 2,
    });
  }

  async extract(filePath: string): Promise<ExtractedMetadata> {
    throw new Error('Not implemented');
  }

  async extractMetadata(
    filePath: string,
  ): Promise<MetadataExtractionResult['metadata'] | null> {
    const result: MetadataExtractionResult = await this.piscina.run(filePath);
    if (result.success) {
      return result.metadata ?? null;
    } else {
      throw new Error(result.reason);
    }
  }

  onModuleDestroy() {
    this.piscina.destroy();
  }
}
