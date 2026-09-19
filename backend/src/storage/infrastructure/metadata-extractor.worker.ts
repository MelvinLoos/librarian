import { parentPort } from 'worker_threads';
import { readFile } from 'fs/promises';
import JSZip from 'jszip';
import {
  MetadataExtractionResult,
  MetadataExtractionContext,
} from './metadata-extraction.types';

// ── XML helpers (namespace-agnostic, entity-decoded) ─────────────────────────

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
      String.fromCharCode(parseInt(code, 16)),
    )
    .replace(/&amp;/g, '&');
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, '').trim();
}

function extractTag(xml: string, name: string): string | null {
  const re = new RegExp(
    `<(?:[\\w.-]+:)?${name}\\b[^>]*>([\\s\\S]*?)</(?:[\\w.-]+:)?${name}\\b[^>]*>`,
  );
  const match = re.exec(xml);
  if (!match) return null;
  const value = stripTags(decodeEntities(match[1]));
  return value.length > 0 ? value : null;
}

function extractAllTags(xml: string, name: string): string[] {
  const re = new RegExp(
    `<(?:[\\w.-]+:)?${name}\\b[^>]*>([\\s\\S]*?)</(?:[\\w.-]+:)?${name}\\b[^>]*>`,
    'g',
  );
  const values: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    const value = stripTags(decodeEntities(match[1]));
    if (value.length > 0) values.push(value);
  }
  return values;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── EPUB parsing ─────────────────────────────────────────────────────────────

async function parseEpub(buffer: Buffer): Promise<MetadataExtractionContext> {
  const zip = await JSZip().loadAsync(buffer);

  const containerEntry = zip.file('META-INF/container.xml');
  if (!containerEntry) {
    throw new Error('EPUB is missing META-INF/container.xml');
  }
  const containerXml = await containerEntry.async('string');
  const fullPathMatch = /rootfile\b[^>]*\bfull-path\s*=\s*"([^"]+)"/i.exec(
    containerXml,
  );
  if (!fullPathMatch) {
    throw new Error('EPUB container.xml does not declare a rootfile');
  }
  const opfPath = fullPathMatch[1];

  const opfEntry = zip.file(opfPath);
  if (!opfEntry) {
    throw new Error(`EPUB OPF not found at ${opfPath}`);
  }
  const opfXml = await opfEntry.async('string');

  const authors = extractAllTags(opfXml, 'creator');

  let isbn: string | undefined;
  const identifierMatch =
    /<dc:identifier\b[^>]*>([\s\S]*?)<\/dc:identifier>/i.exec(opfXml);
  if (identifierMatch) {
    const content = stripTags(decodeEntities(identifierMatch[1]));
    const normalized = content.replace(/[\s-]/g, '');
    if (
      /isbn/i.test(identifierMatch[0]) ||
      /^(?:\d{10}|\d{13}|\d{9}[\dX])$/i.test(normalized)
    ) {
      isbn = content;
    }
  }

  const opfDir = opfPath.includes('/')
    ? opfPath.substring(0, opfPath.lastIndexOf('/'))
    : '';

  let cover: Buffer | undefined;
  let coverMimeType: string | undefined;
  const coverMeta = /<meta\b[^>]*\bname\s*=\s*"cover"[^>]*>/i.exec(opfXml);
  if (coverMeta) {
    const contentId = /content\s*=\s*"([^"]+)"/i.exec(coverMeta[0]);
    if (contentId) {
      const itemRe = new RegExp(
        `<item\\b[^>]*\\bid\\s*=\\s*"${escapeRegExp(contentId[1])}"[^>]*>`,
        'i',
      );
      const itemMatch = itemRe.exec(opfXml);
      if (itemMatch) {
        const hrefMatch = /href\s*=\s*"([^"]+)"/i.exec(itemMatch[0]);
        const mediaTypeMatch = /media-type\s*=\s*"([^"]+)"/i.exec(itemMatch[0]);
        if (hrefMatch) {
          const entryPath = opfDir ? `${opfDir}/${hrefMatch[1]}` : hrefMatch[1];
          const coverEntry = zip.file(entryPath);
          if (coverEntry) {
            cover = Buffer.from(await coverEntry.async('uint8array'));
            coverMimeType = mediaTypeMatch ? mediaTypeMatch[1] : 'image/jpeg';
          }
        }
      }
    }
  }

  return {
    title: extractTag(opfXml, 'title') ?? '',
    authors,
    isbn,
    publisher: extractTag(opfXml, 'publisher') ?? undefined,
    pubDate: extractTag(opfXml, 'date') ?? undefined,
    language: extractTag(opfXml, 'language') ?? undefined,
    description: extractTag(opfXml, 'description') ?? undefined,
    cover,
    coverMimeType,
  };
}

// ── PDF parsing ─────────────────────────────────────────────────────────────

function unescapePdfLiteral(value: string): string {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

function hexToAscii(value: string): string {
  const cleaned = value.replace(/\s+/g, '');
  let out = '';
  for (let i = 0; i + 1 < cleaned.length; i += 2) {
    out += String.fromCharCode(parseInt(cleaned.substr(i, 2), 16));
  }
  return out;
}

function extractInfoValue(pdfText: string, key: string): string | null {
  const literalRe = new RegExp(`/${key}\\b[^\\n]*?\\(([^)]*)\\)`, 'i');
  const literalMatch = literalRe.exec(pdfText);
  if (literalMatch) return unescapePdfLiteral(literalMatch[1]);

  const hexRe = new RegExp(`/${key}\\b[^\\n]*?<([0-9A-Fa-f\\s]+)>`, 'i');
  const hexMatch = hexRe.exec(pdfText);
  if (hexMatch) return hexToAscii(hexMatch[1]);

  return null;
}

function parsePdf(buffer: Buffer): MetadataExtractionContext | null {
  const pdfText = buffer.toString('latin1');

  const xmpMatch = /<x:xmpmeta[\s\S]*?<\/x:xmpmeta>/i.exec(pdfText);
  const xmp = xmpMatch ? xmpMatch[0] : null;

  const fromXmp = (tag: string): string | null =>
    xmp ? extractTag(xmp, tag) : null;

  const title = fromXmp('title') ?? extractInfoValue(pdfText, 'Title');
  const creator = fromXmp('creator') ?? extractInfoValue(pdfText, 'Author');
  const description =
    fromXmp('description') ??
    extractInfoValue(pdfText, 'Subject') ??
    extractInfoValue(pdfText, 'Keywords');
  const publisher =
    fromXmp('publisher') ?? extractInfoValue(pdfText, 'Producer');
  const pubDate = fromXmp('date') ?? extractInfoValue(pdfText, 'CreationDate');
  const language = fromXmp('language');

  if (!title && !creator && !description) {
    return null;
  }

  return {
    title: title ?? '',
    authors: creator ? [creator] : [],
    publisher: publisher ?? undefined,
    pubDate: pubDate ?? undefined,
    language: language ?? undefined,
    description: description ?? undefined,
  };
}

// ── Entry point (piscina worker contract) ────────────────────────────────────

export default async function extractMetadata(
  filePath: string,
): Promise<MetadataExtractionResult> {
  try {
    const buffer = await readFile(filePath);

    const isEpub =
      /\.epub$/i.test(filePath) ||
      (buffer.length > 2 && buffer[0] === 0x50 && buffer[1] === 0x4b);
    const isPdf =
      /\.pdf$/i.test(filePath) ||
      (buffer.length > 4 &&
        buffer.subarray(0, 5).toString('latin1') === '%PDF-');

    if (isEpub) {
      const metadata = await parseEpub(buffer);
      return { success: true, metadata };
    }

    if (isPdf) {
      const metadata = parsePdf(buffer);
      if (metadata === null) {
        return {
          success: false,
          reason: 'PDF does not contain embedded metadata',
        };
      }
      return { success: true, metadata };
    }

    return { success: false, reason: 'Unsupported file format' };
  } catch (error: any) {
    return { success: false, reason: error.message };
  }
}

// Only set up the worker listener if running in a worker thread
if (parentPort) {
  parentPort.on('message', async (filePath: string) => {
    const result = await extractMetadata(filePath);
    if (parentPort) {
      parentPort.postMessage(result);
    }
  });
}
