import { DomainEvent } from '../../../shared/domain/domain-event';
import { CompletionStatus } from '../completion-status.enum';

/**
 * Domain Event: ProgressUpdatedEvent
 *
 * Emitted whenever a User's reading position for a Book changes. It is a
 * historical record of the exact state captured at emission time, enabling
 * choreographed side-effects (e.g., completion anniversary, analytics)
 * without coupling the Reading context to any other Bounded Context.
 */
export class ProgressUpdatedEvent implements DomainEvent {
  public readonly occurredOn: Date;

  constructor(
    public readonly userId: string,
    public readonly bookId: number,
    public readonly locator: string,
    public readonly percentage: number,
    public readonly completionStatus: CompletionStatus,
  ) {
    this.occurredOn = new Date();
  }

  getName(): string {
    return 'ProgressUpdatedEvent';
  }
}
