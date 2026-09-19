import { ReadingProgress } from '../../domain/reading-progress.aggregate';

export interface IReadingProgressRepository {
  upsertProgress(
    userId: string,
    bookId: number,
    locator: string,
    percentage: number,
  ): Promise<void>;
  getUserReadingStates(userId: string): Promise<ReadingProgress[]>;
}
