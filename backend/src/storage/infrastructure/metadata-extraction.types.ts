export interface MetadataExtractionResult {
  success: boolean;
  metadata?: { title: string; author: string };
  reason?: string;
}
