import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { PrismaCustomColumnRepository } from './prisma-custom-column.repository';
import { CustomColumn } from '../domain/entities/custom-column.entity';
import * as os from 'os';
import * as path from 'path';

describe('PrismaCustomColumnRepository (SQLite integration)', () => {
  let prisma: PrismaService;
  let repository: PrismaCustomColumnRepository;
  let dbPath: string;

  beforeAll(async () => {
    dbPath = path.join(
      os.tmpdir(),
      `librarian-column-test-${process.pid}-${Date.now()}.db`,
    );
    process.env.DATABASE_URL = `file:${dbPath}`;

    prisma = new PrismaService();
    await prisma.$connect();

    await prisma.$executeRawUnsafe(`
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
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "LibrarianCustomColumn_name_key" ON "LibrarianCustomColumn"("name");
    `);

    repository = new PrismaCustomColumnRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should upsert and reconstruct a custom column definition', async () => {
    const column = new CustomColumn({
      name: '#read_status',
      value: '',
      dataType: 'text',
      displayLabel: 'Read Status',
      isMultiple: false,
    });

    const saved = await repository.upsert(column);

    expect(saved.id).toBe(column.id);
    const found = await repository.findAll();
    expect(found).toHaveLength(1);
    expect(found[0].props.name).toBe('#read_status');
    expect(found[0].props.dataType).toBe('text');
    expect(found[0].props.displayLabel).toBe('Read Status');
  });

  it('should upsert by name when the id is new', async () => {
    const second = new CustomColumn({
      name: '#genre',
      value: '',
      dataType: 'series',
      isMultiple: true,
    });

    await repository.upsert(second);

    const found = await repository.findAll();
    expect(found).toHaveLength(2);
  });

  it('should delete a custom column by id', async () => {
    const column = new CustomColumn({ name: '#temp', value: '' });
    await repository.upsert(column);

    const deleted = await repository.deleteById(column.id);

    expect(deleted).toBe(true);
    expect(await repository.deleteById(column.id)).toBe(false);
  });
});