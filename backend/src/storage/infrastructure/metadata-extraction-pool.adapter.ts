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
    const result: MetadataExtractionResult = await this.piscina.run(filePath);
    if (!result.success) {
      throw new Error(result.reason ?? 'Metadata extraction failed');
    }
    if (!result.metadata) {
      throw new Error('Metadata extraction returned no data');
    }
    return ExtractedMetadata.fromRaw(result.metadata);
  }

  onModuleDestroy() {
    this.piscina.destroy();
  }
}
