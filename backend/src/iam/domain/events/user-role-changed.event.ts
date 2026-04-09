import { DomainEvent } from '../../../shared/domain/domain-event';

export class UserRoleChangedEvent implements DomainEvent {
  public readonly occurredOn: Date;

  constructor(
    public readonly userId: string,
    public readonly oldRole: string,
    public readonly newRole: string
  ) {
    this.occurredOn = new Date();
  }

  getName(): string {
    return 'UserRoleChangedEvent';
  }
}
