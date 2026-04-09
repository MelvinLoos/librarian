import { UserRoleChangedEvent } from './user-role-changed.event';

describe('UserRoleChangedEvent', () => {
  it('should construct correctly and set occurredAt', () => {
    const event = new UserRoleChangedEvent('user-1', 'Reader', 'Contributor');
    expect(event.userId).toBe('user-1');
    expect(event.oldRole).toBe('Reader');
    expect(event.newRole).toBe('Contributor');
    expect(event.occurredAt).toBeInstanceOf(Date);
  });
});
