import { Controller, Get, Post, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateBookUseCase } from '../application/use-cases/create-book.use-case';
import { GetBookUseCase } from '../application/use-cases/get-book.use-case';
import { CreateBookDto } from './dto/create-book.dto';

@ApiTags('Books')
@Controller('books')
export class BookController {
  constructor(
    private readonly createBookUseCase: CreateBookUseCase,
    private readonly getBookUseCase: GetBookUseCase
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new book', description: 'Creates a new book record in the catalog.' })
  @ApiResponse({ status: 201, description: 'The book has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad request payload.' })
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
  @ApiOperation({ summary: 'Get all books', description: 'Retrieves a list of all books in the catalog.' })
  @ApiResponse({ status: 200, description: 'List of books retrieved successfully.' })
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
  @ApiOperation({ summary: 'Get a book by ID', description: 'Retrieves a specific book by its ID.' })
  @ApiParam({ name: 'id', description: 'The unique ID of the book', example: '123' })
  @ApiResponse({ status: 200, description: 'Book retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Book not found.' })
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