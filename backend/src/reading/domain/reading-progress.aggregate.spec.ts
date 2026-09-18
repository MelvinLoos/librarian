import { ReadingProgress } from './reading-progress.aggregate';
import { Locator } from './value-objects/locator.value-object';
import { ProgressPercentage } from './value-objects/progress-percentage.value-object';
import { CompletionStatus } from './completion-status.enum';
import { ProgressUpdatedEvent } from './events/progress-updated.event';

describe('ReadingProgress (Aggregate Root)', () => {
  const userId = 'user-123';
  const bookId = 42;

  describe('create', () => {
    it('should create a progress aggregate and record an initial ProgressUpdatedEvent', () => {
      const progress = ReadingProgress.create(
        'progress-1',
        userId,
        bookId,
        Locator.create('epubcfi(/6/4!/4/2/1:0)'),
        ProgressPercentage.create(0),
      );

      expect(progress.id).toBe('progress-1');
      expect(progress.userId).toBe(userId);
      expect(progress.bookId).toBe(bookId);
      expect(progress.locator.value).toBe('epubcfi(/6/4!/4/2/1:0)');
      expect(progress.percentage.value).toBe(0);
      expect(progress.updatedAt).toBeInstanceOf(Date);
      expect(progress.domainEvents).toHaveLength(1);
      expect(progress.domainEvents[0]).toBeInstanceOf(ProgressUpdatedEvent);
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct an aggregate without firing domain events', () => {
      const updatedAt = new Date('2026-09-18T10:00:00Z');
      const progress = ReadingProgress.reconstruct(
        'progress-1',
        userId,
        bookId,
        Locator.create('epubcfi(/6/4!/4/2/1:0)'),
        ProgressPercentage.create(42.5),
        CompletionStatus.IN_PROGRESS,
        updatedAt,
      );

      expect(progress.id).toBe('progress-1');
      expect(progress.percentage.value).toBe(42.5);
      expect(progress.completionStatus).toBe(CompletionStatus.IN_PROGRESS);
      expect(progress.updatedAt).toBe(updatedAt);
      expect(progress.domainEvents).toHaveLength(0);
    });
  });

  describe('updateProgress', () => {
    it('should update locator and percentage and recompute the completion status', () => {
      const progress = ReadingProgress.create(
        'progress-1',
        userId,
        bookId,
        Locator.create('epubcfi(/6/4!/4/2/1:0)'),
        ProgressPercentage.create(0),
      );
      progress.clearEvents();

      progress.updateProgress(
        Locator.create('epubcfi(/6/4!/4/2/1:200)'),
        ProgressPercentage.create(55),
      );

      expect(progress.locator.value).toBe('epubcfi(/6/4!/4/2/1:200)');
      expect(progress.percentage.value).toBe(55);
      expect(progress.completionStatus).toBe(CompletionStatus.IN_PROGRESS);
    });

    it('should emit a ProgressUpdatedEvent capturing the new state', () => {
      const progress = ReadingProgress.create(
        'progress-1',
        userId,
        bookId,
        Locator.create('epubcfi(/6/4!/4/2/1:0)'),
        ProgressPercentage.create(0),
      );
      progress.clearEvents();

      progress.updateProgress(
        Locator.create('epubcfi(/6/4!/4/2/1:900)'),
        ProgressPercentage.create(100),
      );

      expect(progress.domainEvents).toHaveLength(1);
      const event = progress.domainEvents[0] as ProgressUpdatedEvent;
      expect(event.userId).toBe(userId);
      expect(event.bookId).toBe(bookId);
      expect(event.locator).toBe('epubcfi(/6/4!/4/2/1:900)');
      expect(event.percentage).toBe(100);
      expect(event.completionStatus).toBe(CompletionStatus.COMPLETED);
    });

    it('should refresh the updatedAt timestamp on every update', () => {
      const progress = ReadingProgress.create(
        'progress-1',
        userId,
        bookId,
        Locator.create('epubcfi(/6/4!/4/2/1:0)'),
        ProgressPercentage.create(0),
      );
      const originalTimestamp = progress.updatedAt;

      progress.updateProgress(
        Locator.create('epubcfi(/6/4!/4/2/1:100)'),
        ProgressPercentage.create(20),
      );

      expect(progress.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalTimestamp.getTime(),
      );
    });
  });

  describe('completion status derivation', () => {
    it('should derive NOT_STARTED for a zero percentage', () => {
      expect(
        ReadingProgress.deriveCompletionStatus(ProgressPercentage.create(0)),
      ).toBe(CompletionStatus.NOT_STARTED);
    });

    it('should derive IN_PROGRESS for a percentage between 0 and 100', () => {
      expect(
        ReadingProgress.deriveCompletionStatus(ProgressPercentage.create(0.5)),
      ).toBe(CompletionStatus.IN_PROGRESS);
      expect(
        ReadingProgress.deriveCompletionStatus(ProgressPercentage.create(99.9)),
      ).toBe(CompletionStatus.IN_PROGRESS);
    });

    it('should derive COMPLETED for a percentage of 100', () => {
      expect(
        ReadingProgress.deriveCompletionStatus(ProgressPercentage.create(100)),
      ).toBe(CompletionStatus.COMPLETED);
    });

    it('should derive COMPLETED when an update reaches 100', () => {
      const progress = ReadingProgress.create(
        'progress-1',
        userId,
        bookId,
        Locator.create('epubcfi(/6/4!/4/2/1:0)'),
        ProgressPercentage.create(0),
      );

      progress.updateProgress(
        Locator.create('epubcfi(/6/4!/4/2/1:999)'),
        ProgressPercentage.create(100),
      );

      expect(progress.completionStatus).toBe(CompletionStatus.COMPLETED);
    });
  });

  describe('clearEvents', () => {
    it('should clear all pending domain events', () => {
      const progress = ReadingProgress.create(
        'progress-1',
        userId,
        bookId,
        Locator.create('epubcfi(/6/4!/4/2/1:0)'),
        ProgressPercentage.create(0),
      );

      progress.clearEvents();

      expect(progress.domainEvents).toHaveLength(0);
    });
  });
});
