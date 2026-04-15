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
