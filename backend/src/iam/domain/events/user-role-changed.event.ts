import { DomainEvent } from './domain-event.interface';

export class UserRoleChangedEvent implements DomainEvent {
  public readonly occurredAt: Date;

  constructor(
    public readonly userId: string,
    public readonly oldRole: string,
    public readonly newRole: string
  ) {
    this.occurredAt = new Date();
  }
}
