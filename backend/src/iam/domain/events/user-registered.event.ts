import { DomainEvent } from '../../../shared/domain/domain-event';

export class UserRegisteredEvent implements DomainEvent {
  public readonly occurredOn: Date;

  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly role: string
  ) {
    this.occurredOn = new Date();
  }

  getName(): string {
    return 'UserRegisteredEvent';
  }
}
