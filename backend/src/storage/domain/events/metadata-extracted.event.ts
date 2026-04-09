import { DomainEvent } from '../../../shared/domain/domain-event';

export class MetadataExtractedEvent implements DomainEvent {
  public readonly occurredOn: Date;

  constructor(
    public readonly assetId: string,
    public readonly metadata: Record<string, any>,
    public readonly bookId?: number,
  ) {
    this.occurredOn = new Date();
  }

  getName(): string {
    return 'MetadataExtractedEvent';
  }
}
