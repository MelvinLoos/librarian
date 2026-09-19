import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { PrismaReadingProgressRepository } from './prisma-reading-progress.repository';
import { ReadingProgress } from '../domain/reading-progress.aggregate';
import * as os from 'os';
import * as path from 'path';

describe('PrismaReadingProgressRepository (SQLite integration)', () => {
  let prisma: PrismaService;
  let repository: PrismaReadingProgressRepository;
  let dbPath: string;
  const userId = 'user-123';

  beforeAll(async () => {
    dbPath = path.join(
      os.tmpdir(),
      `librarian-reading-test-${process.pid}-${Date.now()}.db`,
    );
    process.env.DATABASE_URL = `file:${dbPath}`;

    prisma = new PrismaService();
    await prisma.$connect();

    // Manual DDL mirroring PrismaService.autoMigrate + a minimal legacy books
    // table so the FK targets referenced by LibrarianReadingProgress exist.
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "librarian_users" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'READER',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "books" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "title" TEXT NOT NULL DEFAULT 'Unknown',
        "last_modified" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LibrarianReadingProgress" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "userId" TEXT NOT NULL,
        "bookId" INTEGER NOT NULL,
        "locator" TEXT,
        "percentage" REAL NOT NULL DEFAULT 0.0,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LibrarianReadingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "librarian_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "LibrarianReadingProgress_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "LibrarianReadingProgress_userId_bookId_key" ON "LibrarianReadingProgress"("userId", "bookId");
    `);

    await prisma.$executeRawUnsafe(
      `INSERT INTO librarian_users (id, email, "passwordHash", role) VALUES ('user-123', 'reader@test.io', 'hash', 'READER')`,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO books (id, title) VALUES (1, 'Dune')`,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO books (id, title) VALUES (2, 'Foundation')`,
    );

    repository = new PrismaReadingProgressRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return ReadingProgress aggregates instead of raw records', async () => {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "LibrarianReadingProgress" ("id", "userId", "bookId", "locator", "percentage", "updatedAt") VALUES (7, 'user-123', 1, 'page=42', 42.5, '2026-09-18T10:00:00Z')`,
    );

    const states = await repository.getUserReadingStates(userId);

    expect(Array.isArray(states)).toBe(true);
    expect(states).toHaveLength(1);
    expect(states[0]).toBeInstanceOf(ReadingProgress);
    expect(states[0].id).toBe('7');
    expect(states[0].userId).toBe('user-123');
    expect(states[0].bookId).toBe(1);
    expect(states[0].locator.value).toBe('page=42');
    expect(states[0].percentage.value).toBe(42.5);
    expect(states[0].completionStatus).toBe('IN_PROGRESS');
  });

  it('should order the states by most recent updatedAt first', async () => {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "LibrarianReadingProgress" ("id", "userId", "bookId", "locator", "percentage", "updatedAt") VALUES (8, 'user-123', 2, 'page=5', 5, '2026-09-01T00:00:00Z')`,
    );

    const states = await repository.getUserReadingStates(userId);

    expect(states).toHaveLength(2);
    expect(states[0].id).toBe('7');
    expect(states[0].bookId).toBe(1);
    expect(states[1].id).toBe('8');
    expect(states[1].bookId).toBe(2);
  });

  it('should upsert progress and reflect the new state through getUserReadingStates', async () => {
    await repository.upsertProgress(userId, 2, 'page=10', 10);

    const afterCreate = await repository.getUserReadingStates(userId);
    const created = afterCreate.find((state) => state.bookId === 2);
    expect(created).toBeDefined();
    expect(created?.locator.value).toBe('page=10');
    expect(created?.percentage.value).toBe(10);

    await repository.upsertProgress(userId, 2, 'page=99', 99);

    const afterUpdate = await repository.getUserReadingStates(userId);
    const updated = afterUpdate.filter((state) => state.bookId === 2);
    expect(updated).toHaveLength(1);
    expect(updated[0].locator.value).toBe('page=99');
    expect(updated[0].percentage.value).toBe(99);
  });
});
