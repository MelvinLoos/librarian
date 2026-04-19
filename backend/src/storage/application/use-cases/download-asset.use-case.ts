import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IBookFormatRepository } from '../ports/book-format-repository.interface';
import type { IFileStorage } from '../ports/file-storage.interface';
import { ReadStream } from 'fs';

export interface DownloadAssetInput {
    bookId: number;
    format?: string;
}

export interface DownloadAssetOutput {
    stream: ReadStream;
    fileSize: number;
    mimeType: string;
    fileName: string;
}

@Injectable()
export class DownloadAssetUseCase {
    constructor(
        @Inject('IBookFormatRepository')
        private readonly bookFormatRepository: IBookFormatRepository,
        @Inject('IFileStorage')
        private readonly fileStorage: IFileStorage,
    ) { }

    async execute(input: DownloadAssetInput): Promise<DownloadAssetOutput> {
        const { bookId, format } = input;

        // 1. Resolve format info from legacy database
        const info = await this.bookFormatRepository.getFormatInfo(bookId, format);
        if (!info) {
            throw new NotFoundException(`Format ${format || 'default'} not found for book ${bookId}`);
        }

        // 2. Resolve absolute path via storage adapter
        const absolutePath = this.fileStorage.getBookFilePath(
            info.bookPath,
            info.fileName,
            info.format,
        );

        // 3. Get total file size for Content-Length header
        const fileSize = await this.fileStorage.getFileSize(absolutePath);

        // 4. Create a full stream (no start/end range needed)
        const stream = this.fileStorage.createReadStreamWithRange(absolutePath);

        // 5. Construct a clean filename for the user
        // e.g., "Clean_Code.epub"
        const extension = info.format.toLowerCase();
        const downloadName = `${info.fileName}.${extension}`;

        return {
            stream,
            fileSize,
            mimeType: this.getMimeType(info.format),
            fileName: downloadName,
        };
    }

    private getMimeType(format: string): string {
        const types: Record<string, string> = {
            EPUB: 'application/epub+zip',
            PDF: 'application/pdf',
            MOBI: 'application/x-mobipocket-ebook',
            AZW3: 'application/vnd.amazon.ebook',
        };
        return types[format.toUpperCase()] || 'application/octet-stream';
    }
}