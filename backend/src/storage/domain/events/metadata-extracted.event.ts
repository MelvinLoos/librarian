import { DomainEvent } from '../../../shared/domain/domain-event';
import { AssetProcessingState } from '../asset-processing-state.enum';

export class MetadataExtractedEvent implements DomainEvent {
  public readonly occurredOn: Date;

  constructor(
    public readonly assetId: string,
    public readonly state: AssetProcessingState,
  ) {
    this.occurredOn = new Date();
  }

  getName(): string {
    return 'MetadataExtractedEvent';
  }
}
