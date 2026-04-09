import { Controller, Get, Post, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { CreateBookUseCase } from '../application/use-cases/create-book.use-case';
import { GetBookUseCase } from '../application/use-cases/get-book.use-case';
import { CreateBookDto } from './dto/create-book.dto';

@Controller('books')
export class BookController {
  constructor(
    private readonly createBookUseCase: CreateBookUseCase,
    private readonly getBookUseCase: GetBookUseCase
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createBookDto: CreateBookDto) {
    const book = await this.createBookUseCase.execute(createBookDto);
    return {
      id: book.id,
      title: book.props.title,
      sortTitle: book.props.sortTitle,
      pubdate: book.props.pubdate,
      hasCover: book.props.hasCover,
    };
  }

  @Get()
  async findAll() {
    const books = await this.getBookUseCase.executeAll();
    return books.map(book => ({
      id: book.id,
      title: book.props.title,
      sortTitle: book.props.sortTitle,
      pubdate: book.props.pubdate,
      hasCover: book.props.hasCover,
    }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const book = await this.getBookUseCase.execute(id);
    return {
      id: book.id,
      title: book.props.title,
      sortTitle: book.props.sortTitle,
      pubdate: book.props.pubdate,
      hasCover: book.props.hasCover,
    };
  }
}
