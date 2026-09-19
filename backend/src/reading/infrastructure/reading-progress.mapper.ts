import { ReadingProgress } from '../domain/reading-progress.aggregate';
import { Locator } from '../domain/value-objects/locator.value-object';
import { ProgressPercentage } from '../domain/value-objects/progress-percentage.value-object';

/**
 * Ubiquitous Language: ReadingProgressMapper (Anti-Corruption Layer)
 *
 * Translates the raw persistence representation (Prisma `LibrarianReadingProgress`
 * rows) into the `ReadingProgress` domain aggregate root. This is the ONLY
 * place in the Reading Bounded Context where persistence shapes cross into the
 * domain, so `any` can never leak from the database layer upwards.
 *
 * The mapper uses `ReadingProgress.reconstruct(...)` so no domain events are
 * fired while rehydrating state from storage.
 */
export interface ReadingProgressPersistenceRecord {
  id: number;
  userId: string;
  bookId: number;
  locator: string;
  percentage: number;
  updatedAt: Date;
}

export class ReadingProgressMapper {
  static toDomain(record: ReadingProgressPersistenceRecord): ReadingProgress {
    const percentage = ProgressPercentage.create(record.percentage);

    return ReadingProgress.reconstruct(
      String(record.id),
      record.userId,
      record.bookId,
      Locator.create(record.locator),
      percentage,
      ReadingProgress.deriveCompletionStatus(percentage),
      record.updatedAt,
    );
  }
}
