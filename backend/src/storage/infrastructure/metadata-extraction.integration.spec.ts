import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { PrismaAssetRepository } from './prisma-asset.repository';
import { ExtractMetadataUseCase } from '../application/use-cases/extract-metadata.use-case';
import { IFileStorage } from '../application/ports/file-storage.interface';
import { ExtractedMetadata } from '../domain/value-objects/extracted-metadata.value-object';
import { Asset } from '../domain/asset.aggregate';
import { AssetProcessingState } from '../domain/asset-processing-state.enum';
import { MetadataExtractedEvent } from '../domain/events/metadata-extracted.event';
import { FilePath } from '../domain/value-objects/file-path.value-object';
import { MimeType } from '../domain/value-objects/mime-type.value-object';
import { ByteSize } from '../domain/value-objects/byte-size.value-object';
import { EventEmitter2 } from '@nestjs/event-emitter';
import workerExtract from './metadata-extractor.worker';
import { buildMinimalEpub, FAKE_JPEG } from './fixtures/book-fixtures';
import * as os from 'os';
import * as path from 'path';
import { writeFile } from 'fs/promises';

describe('Metadata Extraction (SQLite integration)', () => {
  let prisma: PrismaService;
  let repository: PrismaAssetRepository;
  let dbPath: string;

  const assetId = 'integration-asset-1';

  beforeAll(async () => {
    dbPath = path.join(
      os.tmpdir(),
      `librarian-extraction-test-${process.pid}-${Date.now()}.db`,
    );
    process.env.DATABASE_URL = `file:${dbPath}`;

    prisma = new PrismaService();
    await prisma.$connect();

    // Minimal legacy Calibre tables so the FK targets referenced by `data`
    // (via the generated Prisma client) exist.
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "books" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "title" TEXT NOT NULL DEFAULT 'Unknown',
        "last_modified" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "data" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "book" INTEGER NOT NULL,
        "format" TEXT NOT NULL DEFAULT 'EPUB',
        "uncompressed_size" INTEGER NOT NULL DEFAULT 0,
        "name" TEXT NOT NULL DEFAULT 'format',
        CONSTRAINT "data_book_fkey" FOREIGN KEY ("book") REFERENCES "books" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(`
      INSERT INTO books (id, title) VALUES (0, 'placeholder')
    `);

    repository = new PrismaAssetRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should parse a real EPUB through the worker, persist asset state, save the cover, and emit the event', async () => {
    const epub = await buildMinimalEpub({
      title: 'Dune',
      authors: ['Frank Herbert'],
      description: 'A desert planet saga.',
      includeCover: true,
    });
    const filePath = path.join(
      os.tmpdir(),
      `librarian-int-${process.pid}-${Date.now()}.epub`,
    );
    await writeFile(filePath, epub);

    // The domain FilePath is internal/relative; the worker receives the
    // absolute temp path through the extraction command.
    const relativeFilePath = '.librarian/assets/integration-asset-1.epub';

    const asset = Asset.upload(
      assetId,
      'FORMAT',
      new FilePath(relativeFilePath),
      new MimeType('application/epub+zip'),
      new ByteSize(epub.length),
    );
    await repository.save(asset);

    // Direct extractor shim: runs the REAL worker function without spawning
    // a piscina worker thread (the .ts worker file cannot be loaded by piscina).
    const directExtractor = {
      extract: async (workerPath: string) => {
        const raw = await workerExtract(workerPath);
        if (!raw.success) {
          throw new Error(raw.reason ?? 'Metadata extraction failed');
        }
        return ExtractedMetadata.fromRaw(raw.metadata!);
      },
    };
    const saveCoverMock = jest.fn(() => '.librarian/covers/integration-asset-1.jpg');
    const fileStorage = { saveCover: saveCoverMock } as unknown as IFileStorage;

    const eventEmitter = new EventEmitter2();
    let capturedEvent: MetadataExtractedEvent | null = null;
    eventEmitter.on(
      'MetadataExtractedEvent',
      (event: MetadataExtractedEvent) => {
        capturedEvent = event;
      },
    );

    const useCase = new ExtractMetadataUseCase(
      repository,
      directExtractor,
      fileStorage,
      eventEmitter,
    );

    const metadata = await useCase.execute({ assetId, filePath });

    expect(metadata).not.toBeNull();
    expect(metadata!.props.title).toBe('Dune');
    expect(metadata!.props.authors).toEqual(['Frank Herbert']);
    expect(metadata!.props.description).toBe('A desert planet saga.');
    expect(metadata!.props.cover).toEqual(FAKE_JPEG);
    expect(metadata!.props.coverMimeType).toBe('image/jpeg');

    expect(saveCoverMock).toHaveBeenCalledTimes(1);

    expect(capturedEvent).not.toBeNull();
    expect(capturedEvent!.assetId).toBe(assetId);
    expect(capturedEvent!.state).toBe(AssetProcessingState.READY);
    expect(capturedEvent!.metadata?.title).toBe('Dune');

    const reloaded = await repository.findById(assetId);
    expect(reloaded).not.toBeNull();
    expect(reloaded!.state).toBe(AssetProcessingState.READY);
  });
});
