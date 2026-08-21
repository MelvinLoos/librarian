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
  index?: number;
}

export interface Identifier {
  type: string;
  value: string;
}

export interface Book {
  id: number;
  title: string;
  authorSort?: string;
  hasCover?: boolean;
  authors?: Author[];
  tags?: Tag[];
  series?: Series | null;
  publisher?: string;
  rating?: number;
  identifiers?: Identifier[];
  comments?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthorInput {
  name: string;
  sort?: string;
  link?: string;
}

export interface TagInput {
  name: string;
}

export interface SeriesInput {
  name: string;
  index?: number;
}

/** Partial metadata payload accepted by `PATCH /catalog/books/:id`. */
export interface BookMetadataInput {
  title?: string;
  authorSort?: string;
  description?: string;
  publisher?: string;
  rating?: number;
  authors?: AuthorInput[];
  tags?: TagInput[];
  series?: SeriesInput;
  identifiers?: Identifier[];
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
