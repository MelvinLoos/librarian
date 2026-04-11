export interface ILegacyBookRepository {
  /**
   * Retrieves the relative folder path for a given book ID from the legacy Calibre DB.
   */
  getBookPath(bookId: number): Promise<string | null>;
}