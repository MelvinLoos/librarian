import { ReadingProgressMapper } from './reading-progress.mapper';
import { ReadingProgress } from '../domain/reading-progress.aggregate';
import { Locator } from '../domain/value-objects/locator.value-object';
import { ProgressPercentage } from '../domain/value-objects/progress-percentage.value-object';
import { CompletionStatus } from '../domain/completion-status.enum';

describe('ReadingProgressMapper (ACL Data Mapper)', () => {
  const baseRecord = {
    id: 7,
    userId: 'user-123',
    bookId: 42,
    locator: 'epubcfi(/6/4!/4/2/1:0)',
    percentage: 42.5,
    updatedAt: new Date('2026-09-18T10:00:00.000Z'),
  };

  it('should map a raw persistence record into a ReadingProgress aggregate restoring every field', () => {
    const progress = ReadingProgressMapper.toDomain(baseRecord);

    expect(progress).toBeInstanceOf(ReadingProgress);
    expect(progress.id).toBe('7');
    expect(progress.userId).toBe('user-123');
    expect(progress.bookId).toBe(42);
    expect(progress.locator).toBeInstanceOf(Locator);
    expect(progress.locator.value).toBe('epubcfi(/6/4!/4/2/1:0)');
    expect(progress.percentage).toBeInstanceOf(ProgressPercentage);
    expect(progress.percentage.value).toBe(42.5);
    expect(progress.completionStatus).toBe(CompletionStatus.IN_PROGRESS);
    expect(progress.updatedAt).toEqual(baseRecord.updatedAt);
  });

  it('should derive NOT_STARTED when the persisted percentage is 0%', () => {
    const progress = ReadingProgressMapper.toDomain({
      ...baseRecord,
      percentage: 0,
    });

    expect(progress.completionStatus).toBe(CompletionStatus.NOT_STARTED);
  });

  it('should derive COMPLETED when the persisted percentage is 100%', () => {
    const progress = ReadingProgressMapper.toDomain({
      ...baseRecord,
      percentage: 100,
    });

    expect(progress.completionStatus).toBe(CompletionStatus.COMPLETED);
  });

  it('should restore state without emitting domain events (reconstruct semantics)', () => {
    const progress = ReadingProgressMapper.toDomain(baseRecord);

    expect(progress.domainEvents).toHaveLength(0);
  });
});
