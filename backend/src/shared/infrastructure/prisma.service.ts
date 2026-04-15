import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as path from 'path';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const libraryPath = process.env.CALIBRE_LIBRARY_PATH;
    const dbUrl = process.env.DATABASE_URL || (libraryPath ? `file:${path.join(libraryPath, 'metadata.db')}` : undefined);
    const dbPath = dbUrl?.replace('file:', '') || '../metadata.db';
    
    const adapter = new PrismaBetterSqlite3({ url: dbPath });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
