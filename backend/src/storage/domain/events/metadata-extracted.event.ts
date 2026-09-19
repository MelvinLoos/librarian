import { DomainEvent } from '../../../shared/domain/domain-event';
import { AssetProcessingState } from '../asset-processing-state.enum';

/**
 * Serialisable metadata payload carried by MetadataExtractedEvent.
 * Plain shape (no domain classes) so it can cross Bounded Context boundaries.
 */
export interface ExtractedMetadataPayload {
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

export class MetadataExtractedEvent implements DomainEvent {
  public readonly occurredOn: Date;

  constructor(
    public readonly assetId: string,
    public readonly state: AssetProcessingState,
    public readonly metadata?: ExtractedMetadataPayload,
  ) {
    this.occurredOn = new Date();
  }

  getName(): string {
    return 'MetadataExtractedEvent';
  }
}
