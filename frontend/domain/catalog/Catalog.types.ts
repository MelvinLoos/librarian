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

export type CustomColumnDataType =
  | 'text'
  | 'series'
  | 'number'
  | 'rating'
  | 'date'
  | 'boolean'

export interface CustomColumn {
  id: string
  name: string
  dataType: CustomColumnDataType
  displayLabel?: string
  isMultiple: boolean
}

export interface CustomColumnInput {
  name: string
  dataType?: CustomColumnDataType
  displayLabel?: string
  isMultiple?: boolean
}

/** Payload accepted by `PATCH /catalog/books/bulk`. */
export interface BulkBookUpdateInput {
  bookIds: number[]
  changes: BookMetadataInput
}
  export interface ReadingProgress {
  /** Primary key of the reading state row. */
  id: number
  /** The user this progress belongs to (String, matches the backend User id). */
  userId: string
  /** The book being read (legacy Calibre book id). */
  bookId: number
  /**
   * Format-agnostic reading position.
   * Examples: EPUB CFI (`epubcfi(/6/4!/4/2/1:0)`) or PDF page (`page=42`).
   */
  locator: string
  /** Reading completion percentage, 0.0 to 100.0. */
  percentage: number
  updatedAt: string
  book?: Book
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
