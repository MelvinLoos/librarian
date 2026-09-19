import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CalibreSqliteAdapter } from './calibre-sqlite.adapter';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Resolves the SQLite database location for the Prisma client.
 *
 * `CALIBRE_LIBRARY_PATH` is the source of truth: Calibre always stores its
 * database at `metadata.db` in the root of the library folder.
 *
 * `DATABASE_URL` (or `PRISMA_DATABASE_URL`) is an optional override, useful for
 * tests and non-Calibre deployments.
 */
function resolveDatabasePath(): string {
  const override =
    process.env.DATABASE_URL?.trim() || process.env.PRISMA_DATABASE_URL?.trim();

  if (override) {
    // The better-sqlite3 adapter expects a plain filesystem path (not a
    // `file:` URI) or the literal `:memory:` string.
    if (override === ':memory:') {
      return override;
    }
    return override.replace(/^file:/, '');
  }

  const libraryPath = process.env.CALIBRE_LIBRARY_PATH?.trim();
  if (libraryPath) {
    return path.join(libraryPath, 'metadata.db');
  }

  throw new Error(
    'No database configured. Set CALIBRE_LIBRARY_PATH to your Calibre library folder, ' +
      'or provide DATABASE_URL as an explicit override.',
  );
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly dbPath: string;

  constructor() {
    const dbPath = resolveDatabasePath();
    const adapter = new CalibreSqliteAdapter({ url: dbPath });
    super({ adapter });
    this.dbPath = dbPath;
  }

  async onModuleInit() {
    this.assertDatabaseAvailable();
    this.logger.log(`Initializing database connection at ${this.dbPath}...`);
    await this.$connect();
    await this.autoMigrate();
  }

  /**
   * Fails fast with an actionable message when the SQLite database cannot be
   * opened. Without this, `better-sqlite3` surfaces an opaque native
   * `TypeError: Cannot open database because the directory does not exist`.
   */
  private assertDatabaseAvailable() {
    if (this.dbPath === ':memory:') {
      return;
    }

    const directory = path.dirname(this.dbPath);
    if (!fs.existsSync(directory)) {
      throw new Error(
        `Calibre library directory not found: ${directory}. ` +
          'Set CALIBRE_LIBRARY_PATH to a valid Calibre library folder.',
      );
    }

    if (!fs.existsSync(this.dbPath)) {
      this.logger.warn(
        `Calibre metadata.db not found at ${this.dbPath}. ` +
          'A new empty database will be created, but it will not contain the ' +
          'legacy Calibre tables expected by the application.',
      );
    }
  }

  private async autoMigrate() {
    try {
      this.logger.log('Checking and synchronizing Librarian tables...');

      // We manually initialize Librarian tables instead of using `prisma db push`.
      // Prisma's `db push` behaves dangerously on unmanaged (legacy) databases by
      // attempting to align or drop tables/columns (e.g. Calibre's books_authors_link),
      // which fails in SQLite due to inline UNIQUE constraints.
      // This raw initialization perfectly achieves zero-config without touching legacy tables.
      await this.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "librarian_users" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "email" TEXT NOT NULL,
          "passwordHash" TEXT NOT NULL,
          "role" TEXT NOT NULL DEFAULT 'READER',
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await this.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "librarian_users_email_key" ON "librarian_users"("email");
      `);

      await this.$executeRawUnsafe(`
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

      await this.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "LibrarianReadingProgress_userId_bookId_key" ON "LibrarianReadingProgress"("userId", "bookId");
      `);

      await this.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "LibrarianCustomColumn" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "dataType" TEXT NOT NULL DEFAULT 'text',
          "displayLabel" TEXT,
          "isMultiple" BOOLEAN NOT NULL DEFAULT FALSE,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await this.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "LibrarianCustomColumn_name_key" ON "LibrarianCustomColumn"("name");
      `);

      this.logger.log('Database synchronization complete.');
    } catch (error: any) {
      this.logger.error('Failed to auto-migrate database', error.message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}