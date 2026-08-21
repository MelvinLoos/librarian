import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { Book } from '../../domain/book.aggregate';
import type { IBookRepository } from '../ports/book.repository.interface';
import { Author } from '../../domain/entities/author.entity';
import { Tag } from '../../domain/entities/tag.entity';
import { Series } from '../../domain/entities/series.entity';
import { Identifier } from '../../domain/value-objects/identifier.value-object';

export interface UpdateAuthorInput {
  name: string;
  sort?: string;
  link?: string;
}

export interface UpdateTagInput {
  name: string;
}

export interface UpdateSeriesInput {
  name: string;
  index?: number;
}

export interface UpdateIdentifierInput {
  type: string;
  value: string;
}

export interface UpdateBookMetadataCommand {
  title?: string;
  sortTitle?: string;
  timestamp?: Date;
  pubdate?: Date;
  hasCover?: boolean;
  authorSort?: string;
  description?: string;
  publisher?: string;
  rating?: number;
  authors?: UpdateAuthorInput[];
  tags?: UpdateTagInput[];
  series?: UpdateSeriesInput;
  identifiers?: UpdateIdentifierInput[];
}

@Injectable()
export class UpdateBookMetadataUseCase {
  private readonly logger = new Logger(UpdateBookMetadataUseCase.name);

  constructor(
    @Inject('IBookRepository')
    private readonly bookRepository: IBookRepository,
  ) {}

  async execute(id: string, command: UpdateBookMetadataCommand): Promise<Book> {
    const book = await this.bookRepository.findById(id);

    if (!book) {
      this.logger.warn(`Book not found for update with ID: ${id}`);
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    book.update({
      title: command.title,
      sortTitle: command.sortTitle,
      timestamp: command.timestamp,
      pubdate: command.pubdate,
      hasCover: command.hasCover,
      authorSort: command.authorSort,
      description: command.description,
      publisher: command.publisher,
      rating: command.rating,
      authors: command.authors?.map((a) => new Author(a)),
      tags: command.tags?.map((t) => new Tag(t)),
      series: command.series
        ? new Series({ name: command.series.name, index: command.series.index })
        : undefined,
      identifiers: command.identifiers?.map(
        (i) => new Identifier({ type: i.type, value: i.value }),
      ),
    });

    const updated = await this.bookRepository.update(book);

    this.logger.log(`Successfully updated book metadata: ${book.id}`);

    return updated;
  }
}
