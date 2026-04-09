import { DomainEvent } from '../../../shared/domain/domain-event';

export class FormatConversionRequestedEvent implements DomainEvent {
  public readonly occurredOn: Date;

  constructor(
    public readonly assetId: string,
    public readonly targetMimeType: string,
  ) {
    this.occurredOn = new Date();
  }

  getName(): string {
    return 'FormatConversionRequestedEvent';
  }
}
