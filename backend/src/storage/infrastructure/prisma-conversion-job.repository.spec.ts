import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { PrismaConversionJobRepository } from './prisma-conversion-job.repository';
import { ConversionJob } from '../domain/conversion-job.entity';
import { ConversionStatus } from '../domain/conversion-status.enum';
import * as os from 'os';
import * as path from 'path';

describe('PrismaConversionJobRepository (SQLite integration)', () => {
  let prisma: PrismaService;
  let repository: PrismaConversionJobRepository;
  let dbPath: string;

  beforeAll(async () => {
    dbPath = path.join(
      os.tmpdir(),
      `librarian-conversion-test-${process.pid}-${Date.now()}.db`,
    );
    process.env.DATABASE_URL = `file:${dbPath}`;

    prisma = new PrismaService();
    await prisma.$connect();

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "books" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "title" TEXT NOT NULL DEFAULT 'Unknown',
        "last_modified" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LibrarianConversionJob" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "bookId" INTEGER NOT NULL,
        "sourceFormat" TEXT NOT NULL,
        "targetFormat" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "progress" REAL NOT NULL DEFAULT 0.0,
        "errorMessage" TEXT,
        "outputPath" TEXT,
        "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LibrarianConversionJob_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(
      `INSERT INTO books (id, title) VALUES (42, 'Dune')`,
    );

    repository = new PrismaConversionJobRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should persist and reconstruct a conversion job', async () => {
    const job = new ConversionJob({
      id: 'job-1',
      bookId: 42,
      sourceFormat: 'EPUB',
      targetFormat: 'MOBI',
    });

    await repository.save(job);

    const found = await repository.findById('job-1');
    expect(found).not.toBeNull();
    expect(found!.props.id).toBe('job-1');
    expect(found!.props.bookId).toBe(42);
    expect(found!.props.sourceFormat).toBe('EPUB');
    expect(found!.props.targetFormat).toBe('MOBI');
    expect(found!.props.status).toBe(ConversionStatus.PENDING);
    expect(found!.props.progress).toBe(0);
  });

  it('should upsert by job id so the latest state wins', async () => {
    const pending = new ConversionJob({
      id: 'job-2',
      bookId: 42,
      sourceFormat: 'EPUB',
      targetFormat: 'TXT',
    });
    await repository.save(pending);

    const running = new ConversionJob({
      id: 'job-2',
      bookId: 42,
      sourceFormat: 'EPUB',
      targetFormat: 'TXT',
      status: ConversionStatus.RUNNING,
      progress: 50,
    });
    await repository.save(running);

    const found = await repository.findById('job-2');
    expect(found).not.toBeNull();
    expect(found!.props.status).toBe(ConversionStatus.RUNNING);
    expect(found!.props.progress).toBe(50);
  });

  it('should return null when the job does not exist', async () => {
    const found = await repository.findById('missing-job');
    expect(found).toBeNull();
  });
});
