import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { PrismaBookRepository } from './prisma-book.repository';
import { Author } from '../domain/entities/author.entity';
import { Tag } from '../domain/entities/tag.entity';
import { Series } from '../domain/entities/series.entity';
import { Identifier } from '../domain/value-objects/identifier.value-object';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

describe('PrismaBookRepository (SQLite integration)', () => {
  let prisma: PrismaService;
  let repository: PrismaBookRepository;
  let dbPath: string;

  async function seedBook(title = 'Initial'): Promise<number> {
    await prisma.$executeRawUnsafe(
      `INSERT INTO books (title, sort, pubdate, series_index, author_sort, has_cover, last_modified, path) VALUES ('${title}', NULL, NULL, 1.0, NULL, 0, CURRENT_TIMESTAMP, NULL)`,
    );
    const rows = await prisma.$queryRawUnsafe(
      `SELECT last_insert_rowid() AS id`,
    );
    return Number(rows[0].id);
  }

  beforeAll(async () => {
    dbPath = path.join(
      os.tmpdir(),
      `librarian-catalog-test-${process.pid}-${Date.now()}.db`,
    );
    process.env.DATABASE_URL = `file:${dbPath}`;

    prisma = new PrismaService();
    await prisma.$connect();

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "books" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "title" TEXT NOT NULL DEFAULT 'Unknown',
        "sort" TEXT,
        "timestamp" DATETIME,
        "pubdate" DATETIME,
        "series_index" REAL DEFAULT 1.0,
        "author_sort" TEXT,
        "uuid" TEXT,
        "has_cover" BOOLEAN DEFAULT false,
        "last_modified" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "path" TEXT
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "authors" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "sort" TEXT,
        "link" TEXT
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "books_authors_link" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "book" INTEGER NOT NULL,
        "author" INTEGER NOT NULL
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "tags" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "books_tags_link" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "book" INTEGER NOT NULL,
        "tag" INTEGER NOT NULL
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "series" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "sort" TEXT
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "books_series_link" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "book" INTEGER NOT NULL,
        "series" INTEGER NOT NULL
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "publishers" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "sort" TEXT,
        "link" TEXT NOT NULL DEFAULT ''
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "books_publishers_link" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "book" INTEGER NOT NULL,
        "publisher" INTEGER NOT NULL
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ratings" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "rating" INTEGER NOT NULL,
        "link" TEXT NOT NULL DEFAULT ''
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "books_ratings_link" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "book" INTEGER NOT NULL,
        "rating" INTEGER NOT NULL
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "identifiers" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "book" INTEGER NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'isbn',
        "val" TEXT NOT NULL
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "comments" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "book" INTEGER NOT NULL,
        "text" TEXT NOT NULL
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "data" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "book" INTEGER NOT NULL,
        "format" TEXT NOT NULL,
        "uncompressed_size" INTEGER NOT NULL,
        "name" TEXT NOT NULL
      );
    `);

    repository = new PrismaBookRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(`DELETE FROM identifiers`);
    await prisma.$executeRawUnsafe(`DELETE FROM books_ratings_link`);
    await prisma.$executeRawUnsafe(`DELETE FROM books_publishers_link`);
    await prisma.$executeRawUnsafe(`DELETE FROM ratings`);
    await prisma.$executeRawUnsafe(`DELETE FROM publishers`);
    await prisma.$executeRawUnsafe(`DELETE FROM books_authors_link`);
    await prisma.$executeRawUnsafe(`DELETE FROM books_tags_link`);
    await prisma.$executeRawUnsafe(`DELETE FROM books_series_link`);
    await prisma.$executeRawUnsafe(`DELETE FROM authors`);
    await prisma.$executeRawUnsafe(`DELETE FROM tags`);
    await prisma.$executeRawUnsafe(`DELETE FROM series`);
    await prisma.$executeRawUnsafe(`DELETE FROM comments`);
    await prisma.$executeRawUnsafe(`DELETE FROM data`);
    await prisma.$executeRawUnsafe(`DELETE FROM books`);
  });

  it('should persist scalar fields and all relations on update() and hydrate them via findById()', async () => {
    const bookId = await seedBook('Initial');

    const loaded = await repository.findById(String(bookId));
    expect(loaded).not.toBeNull();

    loaded!.update({
      title: 'The Way of Kings',
      authorSort: 'Sanderson, Brandon',
      description: 'An epic fantasy novel',
      publisher: 'Tor Books',
      rating: 4.5,
      authors: [new Author({ name: 'Brandon Sanderson' })],
      tags: [new Tag({ name: 'Fantasy' })],
      series: new Series({ name: 'The Stormlight Archive', index: 1 }),
      identifiers: [new Identifier({ type: 'isbn', value: '9780765326355' })],
    });

    const updated = await repository.update(loaded!);
    expect(updated.props.title).toBe('The Way of Kings');
    expect(updated.props.publisher).toBe('Tor Books');
    expect(updated.props.rating!.props.value).toBe(4.5);

    const hydrated = await repository.findById(String(bookId));
    expect(hydrated).not.toBeNull();
    expect(hydrated!.props.title).toBe('The Way of Kings');
    expect(hydrated!.props.authorSort).toBe('Sanderson, Brandon');
    expect(hydrated!.props.description).toBe('An epic fantasy novel');
    expect(hydrated!.props.publisher).toBe('Tor Books');
    expect(hydrated!.props.rating!.props.value).toBe(4.5);
    expect(hydrated!.props.authors).toHaveLength(1);
    expect(hydrated!.props.authors![0].props.name).toBe('Brandon Sanderson');
    expect(hydrated!.props.tags).toHaveLength(1);
    expect(hydrated!.props.tags![0].props.name).toBe('Fantasy');
    expect(hydrated!.props.series!.props.name).toBe('The Stormlight Archive');
    expect(hydrated!.props.series!.props.index).toBe(1);
    expect(hydrated!.props.identifiers).toHaveLength(1);
    expect(hydrated!.props.identifiers![0].props.value).toBe('9780765326355');
  });

  it('should replace existing relations instead of appending on subsequent updates', async () => {
    const bookId = await seedBook('Initial');

    const loaded = await repository.findById(String(bookId));
    loaded!.update({
      authors: [new Author({ name: 'First Author' })],
      tags: [new Tag({ name: 'First Tag' })],
    });
    await repository.update(loaded!);

    const firstHydrated = await repository.findById(String(bookId));
    expect(firstHydrated!.props.authors).toHaveLength(1);
    expect(firstHydrated!.props.tags).toHaveLength(1);

    firstHydrated!.update({
      authors: [new Author({ name: 'Second Author' })],
      tags: [new Tag({ name: 'Second Tag' })],
    });
    await repository.update(firstHydrated!);

    const secondHydrated = await repository.findById(String(bookId));
    expect(secondHydrated!.props.authors).toHaveLength(1);
    expect(secondHydrated!.props.authors![0].props.name).toBe('Second Author');
    expect(secondHydrated!.props.tags).toHaveLength(1);
    expect(secondHydrated!.props.tags![0].props.name).toBe('Second Tag');
  });

  it('should remove relations when an empty array is provided', async () => {
    const bookId = await seedBook('Initial');

    const loaded = await repository.findById(String(bookId));
    loaded!.update({ authors: [new Author({ name: 'Author' })] });
    await repository.update(loaded!);

    const withAuthor = await repository.findById(String(bookId));
    expect(withAuthor!.props.authors).toHaveLength(1);

    withAuthor!.update({ authors: [] });
    await repository.update(withAuthor!);

    const withoutAuthor = await repository.findById(String(bookId));
    expect(withoutAuthor!.props.authors).toHaveLength(0);
  });
});
