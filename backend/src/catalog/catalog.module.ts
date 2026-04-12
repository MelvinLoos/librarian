import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';

// Controllers
import { BookController } from './presentation/book.controller';
import { TagController } from './presentation/tag.controller';
import { AuthorController } from './presentation/author.controller';
import { SeriesController } from './presentation/series.controller';

// Use Cases
import { CreateBookUseCase } from './application/use-cases/create-book.use-case';
import { GetBookUseCase } from './application/use-cases/get-book.use-case';
import { GetTopTagsUseCase } from './application/use-cases/get-top-tags.use-case';
import { GetAllAuthorsUseCase } from './application/use-cases/get-all-authors.use-case';
import { GetAllSeriesUseCase } from './application/use-cases/get-all-series.use-case';

// Repositories (Adapters)
import { PrismaBookRepository } from './infrastructure/prisma-book.repository';
import { PrismaTagRepository } from './infrastructure/prisma-tag.repository';
import { PrismaAuthorRepository } from './infrastructure/prisma-author.repository';
import { PrismaSeriesRepository } from './infrastructure/prisma-series.repository';

@Module({
  imports: [SharedModule],
  controllers: [
    BookController,
    TagController,
    AuthorController,
    SeriesController,
  ],
  providers: [
    // Application Use Cases
    CreateBookUseCase,
    GetBookUseCase,
    GetTopTagsUseCase,
    GetAllAuthorsUseCase,
    GetAllSeriesUseCase,
    
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
  ],
  exports: [
    CreateBookUseCase, 
    GetBookUseCase,
    GetTopTagsUseCase,
    GetAllAuthorsUseCase,
    GetAllSeriesUseCase,
  ],
})
export class CatalogModule {}