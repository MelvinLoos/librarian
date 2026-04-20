export interface Author {
  id: number;
  name: string;
}

export interface Tag {
  id: number;
  name: string;
  count?: number;
}

export interface Series {
  id: number;
  name: string;
}

export interface Book {
  id: number;
  title: string;
  authorSort?: string;
  hasCover?: boolean;
  authors?: Author[];
  tags?: Tag[];
  series?: Series | null;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReadingProgress {
  id: number;
  userId: number;
  bookId: number;
  currentPage: number;
  totalPages: number;
  updatedAt: string;
  book?: Book;
}

// ─────────────────────────────────────────────────────────────────────────────
// Offline / Cache types
// ─────────────────────────────────────────────────────────────────────────────

/** Three-state model for a book's presence in the offline Cache Storage. */
export type BookCacheStatus = 'not-cached' | 'partial' | 'cached'

/** Per-book cache entry held by the bookCache Pinia store. */
export interface BookCacheEntry {
  /** Current cache state for this book. */
  status: BookCacheStatus
  /**
   * Download progress as an integer between 0 and 100.
   * Only meaningful while `status === 'partial'`.
   */
  progress: number
  /** Latest error message, if any. */
  errorMessage?: string
}
