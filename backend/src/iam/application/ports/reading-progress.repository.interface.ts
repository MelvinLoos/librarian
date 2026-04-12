export interface IReadingProgressRepository {
  upsertProgress(userId: string, bookId: number, currentPage: number, totalPages: number): Promise<void>;
  getUserReadingStates(userId: string): Promise<any[]>;
}