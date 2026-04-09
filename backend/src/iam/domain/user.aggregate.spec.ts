import { User } from './user.aggregate';
import { EmailAddress } from './value-objects/email-address.value-object';
import { HashedPassword } from './value-objects/hashed-password.value-object';
import { Role } from './value-objects/role.value-object';
import { UserRegisteredEvent } from './events/user-registered.event';
import { UserRoleChangedEvent } from './events/user-role-changed.event';

describe('User Aggregate Root', () => {
  let email: EmailAddress;
  let password: HashedPassword;
  let role: Role;

  beforeEach(() => {
    email = EmailAddress.create('test@example.com');
    password = HashedPassword.create('secure-hash');
    role = Role.create('READER');
  });

  describe('create', () => {
    it('should create a new user and add a UserRegisteredEvent', () => {
      const userId = '123';
      const user = User.create(userId, email, password, role);

      expect(user.id).toBe(userId);
      expect(user.email.equals(email)).toBe(true);
      expect(user.password.equals(password)).toBe(true);
      expect(user.role.equals(role)).toBe(true);

      const events = user.domainEvents;
      expect(events.length).toBe(1);
      const event = events[0] as UserRegisteredEvent;
      expect(event).toBeInstanceOf(UserRegisteredEvent);
      expect(event.userId).toBe(userId);
      expect(event.email).toBe(email.value);
      expect(event.role).toBe(role.value);
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct a user without adding events', () => {
      const userId = '123';
      const user = User.reconstruct(userId, email, password, role);

      expect(user.id).toBe(userId);
      expect(user.email.equals(email)).toBe(true);
      expect(user.password.equals(password)).toBe(true);
      expect(user.role.equals(role)).toBe(true);

      expect(user.domainEvents.length).toBe(0);
    });
  });

  describe('changeRole', () => {
    it('should change the role and add a UserRoleChangedEvent when the role is different', () => {
      const user = User.create('123', email, password, role);
      user.clearEvents();

      const newRole = Role.create('ADMIN');
      user.changeRole(newRole);

      expect(user.role.equals(newRole)).toBe(true);

      const events = user.domainEvents;
      expect(events.length).toBe(1);
      const event = events[0] as UserRoleChangedEvent;
      expect(event).toBeInstanceOf(UserRoleChangedEvent);
      expect(event.userId).toBe('123');
      expect(event.oldRole).toBe('READER');
      expect(event.newRole).toBe('ADMIN');
    });

    it('should not add an event if the new role is the same as the current role', () => {
      const user = User.create('123', email, password, role);
      user.clearEvents();

      const sameRole = Role.create('READER');
      user.changeRole(sameRole);

      expect(user.domainEvents.length).toBe(0);
    });
  });

  describe('event management', () => {
    it('should immutably return domain events', () => {
      const user = User.create('123', email, password, role);
      const events = user.domainEvents;
      events.pop(); // Should only mute the local array

      expect(user.domainEvents.length).toBe(1); // Original should remain unchanged
    });

    it('should clear events', () => {
      const user = User.create('123', email, password, role);
      expect(user.domainEvents.length).toBe(1);
      user.clearEvents();
      expect(user.domainEvents.length).toBe(0);
    });
  });
});
