import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';

// Controllers
import { BookController } from './presentation/book.controller';
import { TagController } from './presentation/tag.controller';
import { AuthorController } from './presentation/author.controller';
import { SeriesController } from './presentation/series.controller';
import { CustomColumnController } from './presentation/custom-column.controller';

// Use Cases
import { CreateBookUseCase } from './application/use-cases/create-book.use-case';
import { GetBookUseCase } from './application/use-cases/get-book.use-case';
import { GetTopTagsUseCase } from './application/use-cases/get-top-tags.use-case';
import { GetAllAuthorsUseCase } from './application/use-cases/get-all-authors.use-case';
import { GetAllSeriesUseCase } from './application/use-cases/get-all-series.use-case';
import { UpdateBookMetadataUseCase } from './application/use-cases/update-book-metadata.use-case';
import { BulkUpdateBooksUseCase } from './application/use-cases/bulk-update-books.use-case';
import { GetCustomColumnsUseCase } from './application/use-cases/get-custom-columns.use-case';
import { UpsertCustomColumnUseCase } from './application/use-cases/upsert-custom-column.use-case';
import { DeleteCustomColumnUseCase } from './application/use-cases/delete-custom-column.use-case';

// Repositories (Adapters)
import { PrismaBookRepository } from './infrastructure/prisma-book.repository';
import { PrismaTagRepository } from './infrastructure/prisma-tag.repository';
import { PrismaAuthorRepository } from './infrastructure/prisma-author.repository';
import { PrismaSeriesRepository } from './infrastructure/prisma-series.repository';
import { PrismaCustomColumnRepository } from './infrastructure/prisma-custom-column.repository';

@Module({
  imports: [SharedModule],
  controllers: [
    BookController,
    TagController,
    AuthorController,
    SeriesController,
    CustomColumnController,
  ],
  providers: [
    // Application Use Cases
    CreateBookUseCase,
    GetBookUseCase,
    GetTopTagsUseCase,
    GetAllAuthorsUseCase,
    GetAllSeriesUseCase,
    UpdateBookMetadataUseCase,
    BulkUpdateBooksUseCase,
    GetCustomColumnsUseCase,
    UpsertCustomColumnUseCase,
    DeleteCustomColumnUseCase,

    // Infrastructure Adapters bound to their Interface Tokens
    {
      provide: 'IBookRepository',
      useClass: PrismaBookRepository,
    },
    {
      provide: 'ITagRepository',
      useClass: PrismaTagRepository,
    },
    {
      provide: 'IAuthorRepository',
      useClass: PrismaAuthorRepository,
    },
    {
      provide: 'ISeriesRepository',
      useClass: PrismaSeriesRepository,
    },
    {
      provide: 'ICustomColumnRepository',
      useClass: PrismaCustomColumnRepository,
    },
  ],
  exports: [
    CreateBookUseCase,
    GetBookUseCase,
    GetTopTagsUseCase,
    GetAllAuthorsUseCase,
    GetAllSeriesUseCase,
    UpdateBookMetadataUseCase,
  ],
})
export class CatalogModule {}
