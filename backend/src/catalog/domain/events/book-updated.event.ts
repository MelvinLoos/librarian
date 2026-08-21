import { DomainEvent } from '../../../shared/domain/domain-event';

export class BookUpdatedEvent implements DomainEvent {
  public readonly occurredOn: Date;

  constructor(
    public readonly bookId: string,
    public readonly title: string,
  ) {
    this.occurredOn = new Date();
  }

  getName(): string {
    return 'BookUpdatedEvent';
  }
}
