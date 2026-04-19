import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IBookFormatRepository } from '../ports/book-format-repository.interface';
import type { IFileStorage } from '../ports/file-storage.interface';
import { ReadStream } from 'fs';

export interface StreamAssetInput {
    bookId: number;
    format?: string;
    rangeHeader?: string;
}

export interface StreamAssetOutput {
    stream: ReadStream;
    fileSize: number;
    start: number;
    end: number;
    contentLength: number;
    mimeType: string;
}

@Injectable()
export class StreamAssetUseCase {
    constructor(
        @Inject('IBookFormatRepository')
        private readonly bookFormatRepository: IBookFormatRepository,
        @Inject('IFileStorage')
        private readonly fileStorage: IFileStorage,
    ) { }

    async execute(input: StreamAssetInput): Promise<StreamAssetOutput> {
        const { bookId, format, rangeHeader } = input;

        // 1. Get format info from the legacy database
        const info = await this.bookFormatRepository.getFormatInfo(bookId, format);
        if (!info) {
            throw new NotFoundException(`Format ${format || 'default'} not found for book ${bookId}`);
        }

        // 2. Resolve absolute path and total size
        const absolutePath = this.fileStorage.getBookFilePath(info.bookPath, info.fileName, info.format);
        const fileSize = await this.fileStorage.getFileSize(absolutePath);

        // 3. Setup default range (full file)
        let start = 0;
        let end = fileSize - 1;

        // 4. Parse Range Header if present (e.g., "bytes=0-1024")
        if (rangeHeader) {
            const parts = rangeHeader.replace(/bytes=/, "").split("-");
            start = parseInt(parts[0], 10);
            end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            // Logic Check: Range validation
            if (isNaN(start) || start >= fileSize) {
                throw new BadRequestException('Requested range not satisfiable');
            }

            // Clamp the end to the actual file size
            if (end >= fileSize) {
                end = fileSize - 1;
            }
        }

        const contentLength = end - start + 1;
        const mimeType = this.getMimeType(info.format);

        // 5. Generate the partial stream
        const stream = this.fileStorage.createReadStreamWithRange(absolutePath, start, end);

        return {
            stream,
            fileSize,
            start,
            end,
            contentLength,
            mimeType,
        };
    }

    private getMimeType(format: string): string {
        const types: Record<string, string> = {
            'EPUB': 'application/epub+zip',
            'PDF': 'application/pdf',
            'MOBI': 'application/x-mobipocket-ebook',
            'AZW3': 'application/vnd.amazon.ebook',
        };
        return types[format.toUpperCase()] || 'application/octet-stream';
    }
}