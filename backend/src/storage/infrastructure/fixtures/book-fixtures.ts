import JSZip from 'jszip';

/**
 * Test-only fixtures: deterministic in-memory EPUB/PDF files used to exercise
 * the real metadata parsers without committing binary blobs.
 */

export const FAKE_JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
]);

export interface MinimalEpubOptions {
  title: string;
  authors: string[];
  isbn?: string;
  publisher?: string;
  pubDate?: string;
  language?: string;
  description?: string;
  includeCover?: boolean;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildOpf(opts: MinimalEpubOptions): string {
  const identifier =
    opts.isbn !== undefined
      ? `<dc:identifier opf:scheme="ISBN">${escapeXml(opts.isbn)}</dc:identifier>`
      : '<dc:identifier opf:scheme="UUID">urn:uuid:test-uuid</dc:identifier>';

  const creators = opts.authors
    .map((a) => `<dc:creator opf:role="aut">${escapeXml(a)}</dc:creator>`)
    .join('\n    ');

  return `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:opf="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="bookid">
  <metadata>
    ${identifier}
    <dc:title>${escapeXml(opts.title)}</dc:title>
    ${creators}
    ${opts.publisher ? `<dc:publisher>${escapeXml(opts.publisher)}</dc:publisher>` : ''}
    ${opts.pubDate ? `<dc:date>${escapeXml(opts.pubDate)}</dc:date>` : ''}
    ${opts.language ? `<dc:language>${escapeXml(opts.language)}</dc:language>` : ''}
    ${opts.description ? `<dc:description>${escapeXml(opts.description)}</dc:description>` : ''}
    ${opts.includeCover ? '<meta name="cover" content="cover-image" />' : ''}
  </metadata>
  <manifest>
    <item id="chapter1" href="chapter.xhtml" media-type="application/xhtml+xml" />
    ${opts.includeCover ? '<item id="cover-image" href="images/cover.jpg" media-type="image/jpeg" />' : ''}
  </manifest>
  <spine><itemref idref="chapter1" /></spine>
</package>`;
}

export async function buildMinimalEpub(
  opts: MinimalEpubOptions,
): Promise<Buffer> {
  const zip = JSZip();
  zip.file('mimetype', 'application/epub+zip');
  zip.file(
    'META-INF/container.xml',
    '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" /></rootfiles></container>',
  );
  zip.file('OEBPS/content.opf', buildOpf(opts));
  zip.file(
    'OEBPS/chapter.xhtml',
    '<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml"><body><p>Chapter</p></body></html>',
  );
  if (opts.includeCover) {
    zip.file('OEBPS/images/cover.jpg', FAKE_JPEG, { binary: true });
  }

  const out = await zip.generateAsync({ type: 'uint8array' });
  return Buffer.from(out);
}

export interface MinimalPdfOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  producer?: string;
  creationDate?: string;
  xmpTitle?: string;
  xmpAuthor?: string;
  xmpDescription?: string;
  includeXmp?: boolean;
}

function buildXmp(opts: MinimalPdfOptions): string {
  const parts = [
    '<x:xmpmeta xmlns:x="adobe:ns:meta/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">',
    '  <rdf:RDF><rdf:Description rdf:about="">',
  ];
  if (opts.xmpTitle) parts.push(`    <dc:title>${opts.xmpTitle}</dc:title>`);
  if (opts.xmpAuthor)
    parts.push(`    <dc:creator>${opts.xmpAuthor}</dc:creator>`);
  if (opts.xmpDescription)
    parts.push(`    <dc:description>${opts.xmpDescription}</dc:description>`);
  parts.push('  </rdf:Description></rdf:RDF>', '</x:xmpmeta>');
  return parts.join('\n');
}

export function buildMinimalPdf(opts: MinimalPdfOptions): Buffer {
  let content = '%PDF-1.4\n';
  const offsets: number[] = [0];

  const appendObject = (body: string): number => {
    const num = offsets.length;
    offsets[num] = Buffer.byteLength(content, 'latin1');
    content += `${num} 0 obj\n${body}\nendobj\n`;
    return num;
  };

  appendObject('<< /Type /Catalog /Pages 2 0 R >>');
  appendObject('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  appendObject('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>');

  const infoEntries: string[] = [];
  if (opts.title) infoEntries.push(`/Title (${opts.title})`);
  if (opts.author) infoEntries.push(`/Author (${opts.author})`);
  if (opts.subject) infoEntries.push(`/Subject (${opts.subject})`);
  if (opts.keywords) infoEntries.push(`/Keywords (${opts.keywords})`);
  if (opts.producer) infoEntries.push(`/Producer (${opts.producer})`);
  if (opts.creationDate)
    infoEntries.push(`/CreationDate (${opts.creationDate})`);
  appendObject(`<< ${infoEntries.join(' ')} >>`);

  if (opts.includeXmp) {
    const xmpData = buildXmp(opts);
    appendObject(
      `<< /Type /Metadata /Subtype /XML /Length ${Buffer.byteLength(xmpData, 'latin1')} >>\nstream\n${xmpData}\nendstream`,
    );
  }

  const xrefOffset = Buffer.byteLength(content, 'latin1');
  const objectCount = offsets.length; // number of objects (1-based)
  content += `xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objectCount; i++) {
    content += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  content += `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R /Info 4 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(content, 'latin1');
}
