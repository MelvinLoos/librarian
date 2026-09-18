import { DomainEvent } from '../../shared/domain/domain-event';
import { Locator } from './value-objects/locator.value-object';
import { ProgressPercentage } from './value-objects/progress-percentage.value-object';
import { CompletionStatus } from './completion-status.enum';
import { ProgressUpdatedEvent } from './events/progress-updated.event';

/**
 * Ubiquitous Language: ReadingProgress
 *
 * The Aggregate Root of the Reading Bounded Context. It tracks the state of a
 * User's consumption of a specific Book using a format-agnostic Locator
 * (EPUB CFI or PDF page) and a ProgressPercentage (0.0 - 100.0).
 *
 * The Aggregate enforces its own invariants:
 * - The completion status is NEVER stored independently; it is always derived
 *   from the ProgressPercentage on every mutation.
 * - Every mutation emits a ProgressUpdatedEvent for choreographed side-effects.
 */
export class ReadingProgress {
  private _domainEvents: DomainEvent[] = [];

  private constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private readonly _bookId: number,
    private _locator: Locator,
    private _percentage: ProgressPercentage,
    private _completionStatus: CompletionStatus,
    private _updatedAt: Date,
  ) {}

  public static create(
    id: string,
    userId: string,
    bookId: number,
    locator: Locator,
    percentage: ProgressPercentage,
  ): ReadingProgress {
    const progress = new ReadingProgress(
      id,
      userId,
      bookId,
      locator,
      percentage,
      ReadingProgress.deriveCompletionStatus(percentage),
      new Date(),
    );
    progress.addDomainEvent(
      new ProgressUpdatedEvent(
        userId,
        bookId,
        locator.value,
        percentage.value,
        progress._completionStatus,
      ),
    );
    return progress;
  }

  public static reconstruct(
    id: string,
    userId: string,
    bookId: number,
    locator: Locator,
    percentage: ProgressPercentage,
    completionStatus: CompletionStatus,
    updatedAt: Date,
  ): ReadingProgress {
    // Used by repositories / ACL to rebuild the Aggregate without firing events
    return new ReadingProgress(
      id,
      userId,
      bookId,
      locator,
      percentage,
      completionStatus,
      updatedAt,
    );
  }

  public static deriveCompletionStatus(
    percentage: ProgressPercentage,
  ): CompletionStatus {
    if (percentage.value <= 0) {
      return CompletionStatus.NOT_STARTED;
    }
    if (percentage.value >= 100) {
      return CompletionStatus.COMPLETED;
    }
    return CompletionStatus.IN_PROGRESS;
  }

  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get bookId(): number {
    return this._bookId;
  }

  get locator(): Locator {
    return this._locator;
  }

  get percentage(): ProgressPercentage {
    return this._percentage;
  }

  get completionStatus(): CompletionStatus {
    return this._completionStatus;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  public updateProgress(
    locator: Locator,
    percentage: ProgressPercentage,
  ): void {
    this._locator = locator;
    this._percentage = percentage;
    this._completionStatus = ReadingProgress.deriveCompletionStatus(percentage);
    this._updatedAt = new Date();
    this.addDomainEvent(
      new ProgressUpdatedEvent(
        this._userId,
        this._bookId,
        locator.value,
        percentage.value,
        this._completionStatus,
      ),
    );
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
