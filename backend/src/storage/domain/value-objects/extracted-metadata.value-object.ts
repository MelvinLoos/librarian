import type { ExtractedMetadataPayload } from '../events/metadata-extracted.event';

/**
 * ExtractedMetadata
 *
 * Value Object capturing the real metadata parsed out of an uploaded asset
 * (EPUB OPF / PDF Info+XMP). Pure TS — zero external dependencies.
 */
export interface ExtractedMetadataProps {
  title: string;
  authors: string[];
  isbn?: string;
  publisher?: string;
  pubDate?: string;
  language?: string;
  description?: string;
  cover?: Buffer;
  coverMimeType?: string;
}

export class ExtractedMetadata {
  constructor(public readonly props: ExtractedMetadataProps) {}

  static fromRaw(raw: ExtractedMetadataPayload): ExtractedMetadata {
    throw new Error('Not implemented');
  }

  toPayload(): ExtractedMetadataPayload {
    throw new Error('Not implemented');
  }
}