import { DomainEvent } from './domain-event.interface';

export class UserRegisteredEvent implements DomainEvent {
  public readonly occurredAt: Date;

  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly role: string
  ) {
    this.occurredAt = new Date();
  }
}
