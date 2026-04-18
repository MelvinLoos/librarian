import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as path from 'path';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const defaultDbPath = path.resolve(process.cwd(), '../library/metadata.db');
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || defaultDbPath;

    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = `file:${dbPath}`;
    }

    const adapter = new PrismaBetterSqlite3({ url: dbPath });
    super({ adapter });
  }

  async onModuleInit() {
    this.logger.log('Initializing database connection...');
    await this.$connect();
    await this.autoMigrate();
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
          "currentPage" INTEGER NOT NULL DEFAULT 0,
          "totalPages" INTEGER NOT NULL DEFAULT 0,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "LibrarianReadingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "librarian_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "LibrarianReadingProgress_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);

      await this.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "LibrarianReadingProgress_userId_bookId_key" ON "LibrarianReadingProgress"("userId", "bookId");
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
