import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateBookUseCase } from '../application/use-cases/create-book.use-case';
import { GetBookUseCase } from '../application/use-cases/get-book.use-case';
import { UpdateBookMetadataUseCase } from '../application/use-cases/update-book-metadata.use-case';
import { BulkUpdateBooksUseCase } from '../application/use-cases/bulk-update-books.use-case';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookMetadataDto } from './dto/update-book-metadata.dto';
import { BulkUpdateBooksDto } from './dto/bulk-update-books.dto';
import { BulkUpdateCommand } from '../domain/value-objects/bulk-update-command.value-object';
import type { Book } from '../domain/book.aggregate';
import type { Tag } from '../domain/entities/tag.entity';
import type { Author } from '../domain/entities/author.entity';
import type { Series } from '../domain/entities/series.entity';
import {
  CanonicalBookResponseDto,
  TagResponseDto,
  AuthorResponseDto,
  SeriesResponseDto,
} from './dto/catalog-response.dto';

@ApiTags('Books')
@ApiBearerAuth('JWT')
@Controller('books')
export class BookController {
  private readonly logger = new Logger(BookController.name);

  constructor(
    private readonly createBookUseCase: CreateBookUseCase,
    private readonly getBookUseCase: GetBookUseCase,
    private readonly updateBookMetadataUseCase: UpdateBookMetadataUseCase,
    private readonly bulkUpdateBooksUseCase: BulkUpdateBooksUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new book',
    description: 'Creates a new book record in the catalog.',
  })
  @ApiResponse({
    status: 201,
    description: 'The book has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request payload.' })
  async create(@Body() createBookDto: CreateBookDto) {
    this.logger.log(`Received request to create book: ${createBookDto.title}`);
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
  @ApiOperation({
    summary: 'Get all books',
    description: 'Retrieves a list of all books in the catalog.',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Field to sort by (e.g., "timestamp")',
    example: 'timestamp',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
    example: 'desc',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limit the number of results returned',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for title or author',
    example: 'archive',
  })
  @ApiQuery({
    name: 'tag',
    required: false,
    type: String,
    description: 'Filter by tag name',
    example: 'Fiction',
  })
  @ApiResponse({
    status: 200,
    description: 'List of books retrieved successfully.',
  })
  async findAll(
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('tag') tag?: string,
  ) {
    this.logger.log(
      `Received request to find all books (search: ${search}, tag: ${tag}, limit: ${limit})`,
    );
    const books = await this.getBookUseCase.executeAll({
      sort,
      order,
      limit,
      search,
      tag,
    });
    return books.map((book) => ({
      id: book.id,
      title: book.props.title,
      sortTitle: book.props.sortTitle,
      pubdate: book.props.pubdate,
      hasCover: book.props.hasCover,
      authors: book.props.authors?.map((author) => ({
        id: author?.id,
        name: author?.props?.name || 'Unknown Author',
      })),
    }));
  }

  @Patch('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk update book metadata',
    description:
      'Applies the same partial metadata changes to multiple books in one request.',
  })
  @ApiResponse({
    status: 200,
    description: 'Books updated successfully.',
    type: CanonicalBookResponseDto,
    isArray: true,
  })
  @ApiResponse({ status: 404, description: 'One of the books was not found.' })
  @ApiResponse({ status: 400, description: 'Bad request payload.' })
  async bulkUpdate(@Body() dto: BulkUpdateBooksDto) {
    this.logger.log(
      `Received bulk update request for ${dto.bookIds.length} book(s)`,
    );

    const command = BulkUpdateCommand.fromRaw(dto.bookIds, dto.changes);
    const books = await this.bulkUpdateBooksUseCase.execute(command);

    return books.map((book) => this.toEditResponse(book));
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update book metadata',
    description:
      'Partially updates the metadata of an existing book (title, authors, series, series index, tags, rating, publisher, and custom identifiers).',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique ID of the book',
    example: '123',
  })
  @ApiResponse({
    status: 200,
    description: 'Book metadata updated successfully.',
    type: CanonicalBookResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request payload.' })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  async updateMetadata(
    @Param('id') id: string,
    @Body() dto: UpdateBookMetadataDto,
  ) {
    this.logger.log(`Received request to update metadata for book ID: ${id}`);
    const book = await this.updateBookMetadataUseCase.execute(id, dto);
    return this.toEditResponse(book);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a book by ID',
    description: 'Retrieves a specific book by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique ID of the book',
    example: '123',
  })
  @ApiResponse({
    status: 200,
    description: 'Book retrieved successfully.',
    type: CanonicalBookResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  async findOne(@Param('id') id: string) {
    this.logger.log(`Received request to find book by ID: ${id}`);
    const book = await this.getBookUseCase.execute(id);
    return this.toReadResponse(book);
  }

  private toTagResponse(tag: Tag): TagResponseDto {
    return { id: tag.id, name: tag.props.name };
  }

  private toAuthorResponse(author: Author): AuthorResponseDto {
    return { id: author.id, name: author.props.name };
  }

  private toSeriesResponse(series: Series): SeriesResponseDto {
    return {
      id: series.id,
      name: series.props.name,
      index: series.props.index,
    };
  }

  /**
   * Canonical edit DTO shared by PATCH /books/:id and PATCH /books/bulk.
   * Guarantees byte-for-byte identical JSON output between the two flows.
   */
  private toEditResponse(book: Book): CanonicalBookResponseDto {
    return {
      id: book.id,
      title: book.props.title,
      publisher: book.props.publisher,
      rating: book.props.rating?.props.value,
      series: book.props.series
        ? this.toSeriesResponse(book.props.series)
        : undefined,
      tags: (book.props.tags ?? []).map((tag) => this.toTagResponse(tag)),
      identifiers: (book.props.identifiers ?? []).map((identifier) => ({
        type: identifier.props.type,
        value: identifier.props.value,
      })),
      description: book.props.description,
      authors: (book.props.authors ?? []).map((author) =>
        this.toAuthorResponse(author),
      ),
    };
  }

  /**
   * Canonical read DTO for GET /books/:id. Extends the edit DTO with
   * read-context extras while keeping every domain field flat, so editing a
   * book and refreshing the page returns the same fields that were edited.
   */
  private toReadResponse(book: Book): CanonicalBookResponseDto {
    return {
      ...this.toEditResponse(book),
      sortTitle: book.props.sortTitle,
      pubdate: book.props.pubdate,
      hasCover: book.props.hasCover ?? false,
      formats: book.props.formats ?? [],
    };
  }
}
