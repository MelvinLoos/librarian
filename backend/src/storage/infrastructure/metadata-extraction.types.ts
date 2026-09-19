import type { ExtractedMetadataPayload } from '../domain/events/metadata-extracted.event';

/**
 * Raw metadata payload produced by the extraction worker and transported
 * through the piscina pool back to the main thread.
 */
export type MetadataExtractionContext = ExtractedMetadataPayload;

export interface MetadataExtractionResult {
  success: boolean;
  metadata?: MetadataExtractionContext;
  reason?: string;
}
