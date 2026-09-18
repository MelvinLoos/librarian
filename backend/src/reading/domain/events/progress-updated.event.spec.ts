import { ProgressUpdatedEvent } from './progress-updated.event';
import { CompletionStatus } from '../completion-status.enum';

describe('ProgressUpdatedEvent (Domain Event)', () => {
  it('should expose the occurredOn timestamp', () => {
    const event = new ProgressUpdatedEvent(
      'user-123',
      42,
      'epubcfi(/6/4!/4/2/1:0)',
      15.5,
      CompletionStatus.IN_PROGRESS,
    );
    expect(event.occurredOn).toBeInstanceOf(Date);
  });

  it('should expose the aggregate state captured at emission time', () => {
    const event = new ProgressUpdatedEvent(
      'user-123',
      42,
      'epubcfi(/6/4!/4/2/1:0)',
      100,
      CompletionStatus.COMPLETED,
    );
    expect(event.userId).toBe('user-123');
    expect(event.bookId).toBe(42);
    expect(event.locator).toBe('epubcfi(/6/4!/4/2/1:0)');
    expect(event.percentage).toBe(100);
    expect(event.completionStatus).toBe(CompletionStatus.COMPLETED);
  });

  it('should return the canonical event name', () => {
    const event = new ProgressUpdatedEvent(
      'user-123',
      42,
      'epubcfi(/6/4!/4/2/1:0)',
      10,
      CompletionStatus.IN_PROGRESS,
    );
    expect(event.getName()).toBe('ProgressUpdatedEvent');
  });
});
