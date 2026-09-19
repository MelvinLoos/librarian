import type { ExtractedMetadataPayload } from '../domain/events/metadata-extracted.event';

export interface MetadataExtractionResult {
  success: boolean;
  metadata?: ExtractedMetadataPayload;
  reason?: string;
}
