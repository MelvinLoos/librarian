import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { BookController } from './presentation/book.controller';
import { CreateBookUseCase } from './application/use-cases/create-book.use-case';
import { GetBookUseCase } from './application/use-cases/get-book.use-case';
import { PrismaBookRepository } from './infrastructure/prisma-book.repository';

@Module({
  imports: [SharedModule],
  controllers: [BookController],
  providers: [
    CreateBookUseCase,
    GetBookUseCase,
    {
      provide: 'IBookRepository',
      useClass: PrismaBookRepository,
    },
  ],
  exports: [CreateBookUseCase, GetBookUseCase],
})
export class CatalogModule {}
