import { UserRegisteredEvent } from './user-registered.event';

describe('UserRegisteredEvent', () => {
  it('should construct correctly and set occurredAt', () => {
    const event = new UserRegisteredEvent('user-1', 'test@example.com', 'Admin');
    expect(event.userId).toBe('user-1');
    expect(event.email).toBe('test@example.com');
    expect(event.role).toBe('Admin');
    expect(event.occurredAt).toBeInstanceOf(Date);
  });
});
