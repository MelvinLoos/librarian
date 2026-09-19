import { parentPort } from 'worker_threads';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { execFile } from 'node:child_process';
import JSZip from 'jszip';
import { FormatRegistry } from '../domain/services/format-registry';

export interface ConversionWorkerInput {
  jobId: string;
  sourceAbsolutePath: string;
  sourceFormat: string;
  targetFormat: string;
  outputRelativePath: string;
}

export interface ConversionWorkerResult {
  success: boolean;
  errorMessage?: string;
}

const outputAbsolutePath = (relativePath: string): string =>
  resolve(process.cwd(), relativePath);

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Native: EPUB -> TXT ─────────────────────────────────────────────────────

async function epubToTxt(
  sourcePath: string,
  outputPath: string,
): Promise<void> {
  const buffer = await readFile(sourcePath);
  const zip = await JSZip().loadAsync(buffer);

  const parts: string[] = [];
  for (const entry of zip.file(/\.x?html$/i)) {
    const content = await entry.async('string');
    const stripped = stripHtml(content);
    if (stripped.length > 0) parts.push(stripped);
  }

  await writeFile(outputPath, parts.join('\n\n'), 'utf8');
}

// ── Native: TXT -> EPUB ─────────────────────────────────────────────────────

async function txtToEpub(
  sourcePath: string,
  outputPath: string,
): Promise<void> {
  const text = (await readFile(sourcePath, 'utf8')).trim();
  const title =
    (text.split(/\r?\n/, 1)[0] ?? '').trim().slice(0, 120) || 'Converted Book';

  const container =
    '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" /></rootfiles></container>';
  const opf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/" version="2.0" unique-identifier="bookid">
  <metadata>
    <dc:identifier id="bookid" opf:scheme="UUID">urn:uuid:converted</dc:identifier>
    <dc:title>${escapeHtml(title)}</dc:title>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="chapter1" href="chapter.xhtml" media-type="application/xhtml+xml" />
  </manifest>
  <spine><itemref idref="chapter1" /></spine>
</package>`;
  const chapter = `<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml"><body><pre>${escapeHtml(text)}</pre></body></html>`;

  const zip = JSZip();
  zip.file('mimetype', 'application/epub+zip');
  zip.file('META-INF/container.xml', container);
  zip.file('OEBPS/content.opf', opf);
  zip.file('OEBPS/chapter.xhtml', chapter);

  const data = await zip.generateAsync({ type: 'uint8array' });
  await writeFile(outputPath, Buffer.from(data));
}

// ── CLI: Calibre ebook-convert ──────────────────────────────────────────────

async function convertWithCli(
  sourcePath: string,
  outputPath: string,
): Promise<void> {
  let result: { exitCode: number | null } | undefined;
  try {
    result = await Promise.resolve(
      execFile('ebook-convert', [sourcePath, outputPath]),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Calibre ebook-convert CLI is not installed; cannot convert via CLI. Install Calibre or use a supported pair (EPUB<->TXT). (${message})`,
    );
  }

  // A null exitCode means the binary could never be launched (e.g. missing).
  if (result === undefined || result.exitCode !== 0) {
    throw new Error(
      result?.exitCode === null
        ? 'Calibre ebook-convert CLI is not installed; cannot convert via CLI. Install Calibre or use a supported pair (EPUB<->TXT).'
        : `ebook-convert exited with code ${result?.exitCode ?? 'unknown'}`,
    );
  }
}

// ── Entry point (piscina worker contract) ────────────────────────────────────

export default async function convertBook(
  input: ConversionWorkerInput,
): Promise<ConversionWorkerResult> {
  try {
    const outputPath = outputAbsolutePath(input.outputRelativePath);
    await mkdir(dirname(outputPath), { recursive: true });

    if (FormatRegistry.isNative(input.sourceFormat, input.targetFormat)) {
      const targeted = [
        input.sourceFormat.trim().toUpperCase(),
        input.targetFormat.trim().toUpperCase(),
      ];
      if (targeted[0] === 'EPUB' && targeted[1] === 'TXT') {
        await epubToTxt(input.sourceAbsolutePath, outputPath);
      } else {
        await txtToEpub(input.sourceAbsolutePath, outputPath);
      }
    } else {
      await convertWithCli(input.sourceAbsolutePath, outputPath);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

if (parentPort) {
  parentPort.on('message', (input: ConversionWorkerInput) => {
    void convertBook(input).then((result) => {
      if (parentPort) {
        parentPort.postMessage(result);
      }
    });
  });
}
