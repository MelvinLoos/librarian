import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { IBookFormatRepository, BookFormatInfo } from '../application/ports/book-format-repository.interface';

@Injectable()
export class PrismaBookFormatRepository implements IBookFormatRepository {
    constructor(private readonly prisma: PrismaService) { }

    async getFormatInfo(bookId: number, format?: string): Promise<BookFormatInfo | null> {
        const book = await this.prisma.book.findUnique({
            where: { id: bookId },
            select: { path: true },
        });

        if (!book || !book.path) {
            return null;
        }

        const dataEntry = await this.prisma.data.findFirst({
            where: {
                bookId: bookId,
                format: format ? format.toUpperCase() : undefined,
            },
            select: {
                name: true,
                format: true,
                uncompressedSize: true,
            },
        });

        if (!dataEntry) return null;

        return {
            bookPath: book.path,
            fileName: dataEntry.name,
            format: dataEntry.format,
            size: dataEntry.uncompressedSize,
        };
    }
}