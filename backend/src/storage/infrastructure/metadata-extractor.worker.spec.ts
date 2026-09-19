import extractMetadata from './metadata-extractor.worker';
import {
  buildMinimalEpub,
  buildMinimalPdf,
  FAKE_JPEG,
} from './fixtures/book-fixtures';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFile, unlink } from 'fs/promises';

describe('metadata-extractor.worker', () => {
  let counter = 0;

  const writeFixture = async (
    buffer: Buffer,
    extension: string,
  ): Promise<string> => {
    const filePath = join(
      tmpdir(),
      `librarian-worker-${process.pid}-${Date.now()}-${counter++}.${extension}`,
    );
    await writeFile(filePath, buffer);
    return filePath;
  };

  const removeFixture = (filePath: string): void => {
    void unlink(filePath).catch(() => undefined);
  };

  describe('EPUB', () => {
    it('should parse OPF metadata and return the real fields', async () => {
      const epub = await buildMinimalEpub({
        title: 'Dune',
        authors: ['Frank Herbert', 'Kevin J. Anderson'],
        isbn: '0-441-17242-7',
        publisher: 'Chilton Books',
        pubDate: '1965-08-01',
        language: 'en',
        description: 'Tom & Jerry meet the sandworms.',
      });
      const filePath = await writeFixture(epub, 'epub');

      try {
        const result = await extractMetadata(filePath);

        expect(result.success).toBe(true);
        expect(result.metadata?.title).toBe('Dune');
        expect(result.metadata?.authors).toEqual([
          'Frank Herbert',
          'Kevin J. Anderson',
        ]);
        expect(result.metadata?.isbn).toBe('0-441-17242-7');
        expect(result.metadata?.publisher).toBe('Chilton Books');
        expect(result.metadata?.pubDate).toBe('1965-08-01');
        expect(result.metadata?.language).toBe('en');
        expect(result.metadata?.description).toBe(
          'Tom & Jerry meet the sandworms.',
        );
      } finally {
        removeFixture(filePath);
      }
    });

    it('should extract the cover image from the manifest', async () => {
      const epub = await buildMinimalEpub({
        title: 'Dune',
        authors: ['Frank Herbert'],
        includeCover: true,
      });
      const filePath = await writeFixture(epub, 'epub');

      try {
        const result = await extractMetadata(filePath);

        expect(result.success).toBe(true);
        expect(result.metadata?.cover).toEqual(FAKE_JPEG);
        expect(result.metadata?.coverMimeType).toBe('image/jpeg');
      } finally {
        removeFixture(filePath);
      }
    });

    it('should leave the cover undefined when the EPUB has no manifest cover', async () => {
      const epub = await buildMinimalEpub({
        title: 'Dune',
        authors: ['Frank Herbert'],
      });
      const filePath = await writeFixture(epub, 'epub');

      try {
        const result = await extractMetadata(filePath);

        expect(result.success).toBe(true);
        expect(result.metadata?.cover).toBeUndefined();
        expect(result.metadata?.coverMimeType).toBeUndefined();
      } finally {
        removeFixture(filePath);
      }
    });
  });

  describe('PDF', () => {
    it('should extract metadata from the Info dictionary if embedded', async () => {
      const pdf = buildMinimalPdf({
        title: 'The Dune',
        author: 'Frank Herbert',
        subject: 'A sci-fi classic',
        keywords: 'dune, sci-fi',
        producer: 'LibreOffice',
        creationDate: 'D:20240101120000',
      });
      const filePath = await writeFixture(pdf, 'pdf');

      try {
        const result = await extractMetadata(filePath);

        expect(result.success).toBe(true);
        expect(result.metadata?.title).toBe('The Dune');
        expect(result.metadata?.authors).toEqual(['Frank Herbert']);
        expect(result.metadata?.description).toBe('A sci-fi classic');
      } finally {
        removeFixture(filePath);
      }
    });

    it('should prefer XMP/Dublin Core metadata when embedded', async () => {
      const pdf = buildMinimalPdf({
        title: 'The Dune',
        author: 'Frank Herbert',
        xmpTitle: 'XMP Title',
        xmpAuthor: 'XMP Author',
        xmpDescription: 'XMP Description',
        includeXmp: true,
      });
      const filePath = await writeFixture(pdf, 'pdf');

      try {
        const result = await extractMetadata(filePath);

        expect(result.success).toBe(true);
        expect(result.metadata?.title).toBe('XMP Title');
        expect(result.metadata?.authors).toEqual(['XMP Author']);
        expect(result.metadata?.description).toBe('XMP Description');
      } finally {
        removeFixture(filePath);
      }
    });
  });

  describe('unsupported files', () => {
    it('should return a failure result for an unknown format', async () => {
      const filePath = await writeFixture(Buffer.from('not a book'), 'txt');

      try {
        const result = await extractMetadata(filePath);

        expect(result.success).toBe(false);
        expect(result.reason).toBeDefined();
      } finally {
        removeFixture(filePath);
      }
    });
  });
});
