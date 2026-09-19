import convertBook, { ConversionWorkerInput } from './conversion.worker';
import { buildMinimalEpub } from './fixtures/book-fixtures';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import JSZip from 'jszip';

describe('conversion.worker', () => {
  let counter = 0;

  const writeSource = async (
    buffer: Buffer,
    extension: string,
  ): Promise<string> => {
    const filePath = join(
      tmpdir(),
      `librarian-conv-${process.pid}-${Date.now()}-${counter++}.${extension}`,
    );
    await writeFile(filePath, buffer);
    return filePath;
  };

  const cleanup = (...paths: string[]): void => {
    for (const p of paths) void unlink(p).catch(() => undefined);
  };

  describe('native: EPUB -> TXT', () => {
    it('should strip the EPUB content into a plain text file', async () => {
      const epub = await buildMinimalEpub({
        title: 'Dune',
        authors: ['Frank Herbert'],
      });
      const srcPath = await writeSource(epub, 'epub');
      const outRel = `.librarian/conversions/test-${process.pid}-${Date.now()}.txt`;
      const input: ConversionWorkerInput = {
        jobId: 'w-epub-txt',
        sourceAbsolutePath: srcPath,
        sourceFormat: 'EPUB',
        targetFormat: 'TXT',
        outputRelativePath: outRel,
      };

      try {
        const result = await convertBook(input);

        expect(result.success).toBe(true);
        const text = await readFile(resolve(process.cwd(), outRel), 'utf8');
        expect(text).toContain('Chapter');
      } finally {
        cleanup(srcPath, resolve(process.cwd(), outRel));
      }
    });
  });

  describe('native: TXT -> EPUB', () => {
    it('should wrap plain text into a minimal EPUB', async () => {
      const srcPath = await writeSource(
        Buffer.from('Hello converted book'),
        'txt',
      );
      const outRel = `.librarian/conversions/test-${process.pid}-${Date.now()}.epub`;
      const input: ConversionWorkerInput = {
        jobId: 'w-txt-epub',
        sourceAbsolutePath: srcPath,
        sourceFormat: 'TXT',
        targetFormat: 'EPUB',
        outputRelativePath: outRel,
      };

      try {
        const result = await convertBook(input);

        expect(result.success).toBe(true);
        const outAbs = resolve(process.cwd(), outRel);
        const buffer = await readFile(outAbs);
        const zip = await JSZip().loadAsync(buffer);
        expect(zip.file('META-INF/container.xml')).not.toBeNull();
        const opf = await zip.file('OEBPS/content.opf')!.async('string');
        expect(opf).toContain('Hello converted book');
      } finally {
        cleanup(srcPath, resolve(process.cwd(), outRel));
      }
    });
  });

  describe('CLI-backed formats', () => {
    it('should fail with a clear message when ebook-convert is not installed', async () => {
      const epub = await buildMinimalEpub({
        title: 'Dune',
        authors: ['Frank Herbert'],
      });
      const srcPath = await writeSource(epub, 'epub');
      const outRel = `.librarian/conversions/test-${process.pid}-${Date.now()}.mobi`;
      const input: ConversionWorkerInput = {
        jobId: 'w-cli',
        sourceAbsolutePath: srcPath,
        sourceFormat: 'EPUB',
        targetFormat: 'MOBI',
        outputRelativePath: outRel,
      };

      try {
        const result = await convertBook(input);

        expect(result.success).toBe(false);
        expect(result.errorMessage).toContain('ebook-convert');
      } finally {
        cleanup(srcPath, resolve(process.cwd(), outRel));
      }
    });
  });
});
