export interface BookFormatInfo {
    bookPath: string;   // Legacy Calibre folder relative path
    fileName: string;   // e.g. "Clean Code - Robert Martin"
    format: string;     // e.g. "EPUB", "PDF"
    size: number;       // uncompressed_size from Data table
}

export interface IBookFormatRepository {
    getFormatInfo(bookId: number, format?: string): Promise<BookFormatInfo | null>;
}
