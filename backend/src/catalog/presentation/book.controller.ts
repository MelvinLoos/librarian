import { Controller, Get, Post, Body, Param, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreateBookUseCase } from '../application/use-cases/create-book.use-case';
import { GetBookUseCase } from '../application/use-cases/get-book.use-case';
import { CreateBookDto } from './dto/create-book.dto';

@ApiTags('Books')
@ApiBearerAuth('JWT')
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
  @ApiQuery({ name: 'sort', required: false, description: 'Field to sort by (e.g., "timestamp")', example: 'timestamp' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'], description: 'Sort order', example: 'desc' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limit the number of results returned', example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for title or author', example: 'archive' })
  @ApiQuery({ name: 'tag', required: false, type: String, description: 'Filter by tag name', example: 'Fiction' })
  @ApiResponse({ status: 200, description: 'List of books retrieved successfully.' })
  async findAll(
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('tag') tag?: string,
  ) {
    const books = await this.getBookUseCase.executeAll({ sort, order, limit, search, tag });
    return books.map(book => ({
      id: book.id,
      title: book.props.title,
      sortTitle: book.props.sortTitle,
      pubdate: book.props.pubdate,
      hasCover: book.props.hasCover,
      authors: book.props.authors?.map(author => ({
        id: author?.id,
        name: author?.props?.name || 'Unknown Author',
      })),
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
      authors: book.props.authors?.map(author => ({
        id: author?.id,
        name: author?.props?.name || 'Unknown Author',
      })),
    };
  }
}