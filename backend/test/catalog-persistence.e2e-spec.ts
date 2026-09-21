/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { CatalogModule } from './../src/catalog/catalog.module';
import { configureApp } from './../src/app.setup';
import { PrismaService } from './../src/shared/infrastructure/prisma.service';

/**
 * Sprint 4.2 - P0 Regression: Catalog API Silent Persistence Failure (#37)
 *
 * The Persistence Guarantee: an HTTP 200 from PATCH /api/books/:id MUST equal a
 * successful database write, AND a subsequent GET /api/books/:id (a page refresh)
 * MUST return the edited fields. Previously the GET read contract dropped
 * publisher / rating / identifiers, so edited data appeared to \"reset on refresh\"
 * even though it was persisted.
 */
describe('Catalog API persistence (e2e, real SQLite DB)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const findOrCreate = async (
    model: 'author' | 'tag' | 'publisher' | 'series',
    name: string,
  ) => {
    const existing = await prisma[model].findFirst({ where: { name } });
    if (existing) return existing;
    return prisma[model].create({ data: { name } });
  };

  beforeAll(async () => {
    // Boot against a disposable copy of the real Calibre schema so every legacy
    // table (books, authors, comments, ...) exists exactly as in production.
    const dbPath = path.join(
      os.tmpdir(),
      `catalog-persistence-${process.pid}-${Date.now()}.db`,
    );
    fs.copyFileSync(
      '/home/melvin/projects/librarian/library/metadata.db',
      dbPath,
    );
    process.env.DATABASE_URL = dbPath;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CatalogModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('PATCH persists changes AND GET returns them after refresh', async () => {
    // ---- Seed a book with full relations directly in the database ----
    const seeded = await prisma.book.create({
      data: { title: 'Seed Book', path: '' },
    });

    const author = await findOrCreate('author', 'Brandon Sanderson P0');
    const tag = await findOrCreate('tag', 'P0 Fantasy Tag');
    const publisher = await findOrCreate('publisher', 'P0 Tor Books');
    const series = await findOrCreate('series', 'P0 Stormlight');
    const rating = await prisma.rating.findFirst({ where: { rating: 8 } });
    const ratingId = rating
      ? rating.id
      : (await prisma.rating.create({ data: { rating: 8 } })).id;

    await prisma.bookAuthorLink.create({
      data: { bookId: seeded.id, authorId: author.id },
    });
    await prisma.bookTagLink.create({
      data: { bookId: seeded.id, tagId: tag.id },
    });
    await prisma.bookSeriesLink.create({
      data: { bookId: seeded.id, seriesId: series.id },
    });
    await prisma.booksPublisherLink.create({
      data: { bookId: seeded.id, publisherId: publisher.id },
    });
    await prisma.booksRatingLink.create({
      data: { bookId: seeded.id, ratingId },
    });
    await prisma.comment.create({
      data: { bookId: seeded.id, text: 'Old description' },
    });

    // ---- PATCH: partial metadata update (what EditMetadataModal sends) ----
    const patch = await request(app.getHttpServer())
      .patch(`/api/books/${seeded.id}`)
      .send({
        title: 'P0 Renamed Book',
        publisher: 'P0 Tor Books',
        rating: 4,
        description: 'P0 Epic fantasy',
        authors: [{ name: 'Brandon Sanderson P0' }],
        tags: [{ name: 'P0 Fantasy Tag' }],
        series: { name: 'P0 Stormlight', index: 1 },
        identifiers: [{ type: 'isbn', value: '9780765326355p0' }],
      });

    expect(patch.status).toBe(200);
    expect(patch.body.title).toBe('P0 Renamed Book');
    expect(patch.body.publisher).toBe('P0 Tor Books');
    expect(patch.body.rating).toBe(4);

    // ---- Persistence Guarantee: verify DIRECTLY in the database ----
    const raw = await prisma.book.findUnique({
      where: { id: seeded.id },
      include: {
        authors: { include: { author: true } },
        tags: { include: { tag: true } },
        series: { include: { series: true } },
        publishers: { include: { publisher: true } },
        ratings: { include: { rating: true } },
        comments: true,
        identifiers: true,
      },
    });

    expect(raw).not.toBeNull();
    expect(raw!.title).toBe('P0 Renamed Book');
    expect(raw!.comments?.[0]?.text).toBe('P0 Epic fantasy');
    expect(raw!.authors?.map((a) => a.author.name)).toEqual([
      'Brandon Sanderson P0',
    ]);
    expect(raw!.tags?.map((t) => t.tag.name)).toEqual(['P0 Fantasy Tag']);
    expect(raw!.series?.[0]?.series?.name).toBe('P0 Stormlight');
    expect(raw!.publishers?.[0]?.publisher?.name).toBe('P0 Tor Books');
    expect(raw!.ratings?.[0]?.rating?.rating).toBe(8); // 4.0 * 2 Calibre scale

    // ---- Simulated refresh: the same fields MUST come back via the API ----
    const fresh = await request(app.getHttpServer()).get(
      `/api/books/${seeded.id}`,
    );

    expect(fresh.status).toBe(200);
    expect(fresh.body.title).toBe('P0 Renamed Book');
    expect(fresh.body.description).toBe('P0 Epic fantasy');
    expect(fresh.body.publisher).toBe('P0 Tor Books');
    expect(fresh.body.rating).toBe(4);
    expect(fresh.body.series?.name).toBe('P0 Stormlight');
    expect(fresh.body.series?.index).toBe(1);
    expect(fresh.body.authors?.[0]?.name).toBe('Brandon Sanderson P0');
    expect(fresh.body.tags?.[0]?.name).toBe('P0 Fantasy Tag');
    expect(fresh.body.identifiers?.[0]?.value).toBe('9780765326355p0');
  });
});
