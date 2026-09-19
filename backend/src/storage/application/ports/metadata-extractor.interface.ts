import { ExtractedMetadata } from '../../domain/value-objects/extracted-metadata.value-object';

export interface IMetadataExtractor {
  extract(filePath: string): Promise<ExtractedMetadata>;
}
