import { EmailAddress } from './value-objects/email-address.value-object';
import { HashedPassword } from './value-objects/hashed-password.value-object';
import { Role } from './value-objects/role.value-object';
import { DomainEvent } from './events/domain-event.interface';
import { UserRegisteredEvent } from './events/user-registered.event';
import { UserRoleChangedEvent } from './events/user-role-changed.event';

export class User {
  private _domainEvents: DomainEvent[] = [];

  private constructor(
    private readonly _id: string,
    private _email: EmailAddress,
    private _password: HashedPassword,
    private _role: Role
  ) {}

  public static create(id: string, email: EmailAddress, password: HashedPassword, role: Role): User {
    const user = new User(id, email, password, role);
    user.addDomainEvent(new UserRegisteredEvent(id, email.value, role.value));
    return user;
  }

  public static reconstruct(id: string, email: EmailAddress, password: HashedPassword, role: Role): User {
    // Used by repositories / ACL to reconstruct without firing events
    return new User(id, email, password, role);
  }

  get id(): string {
    return this._id;
  }

  get email(): EmailAddress {
    return this._email;
  }

  get password(): HashedPassword {
    return this._password;
  }

  get role(): Role {
    return this._role;
  }

  public changeRole(newRole: Role): void {
    if (!this._role.equals(newRole)) {
      const oldRole = this._role;
      this._role = newRole;
      this.addDomainEvent(new UserRoleChangedEvent(this._id, oldRole.value, newRole.value));
    }
  }

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }

  private addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }
}
