import { ExtractedMetadata } from './extracted-metadata.value-object';

describe('ExtractedMetadata', () => {
  it('should create a valid value object with all fields', () => {
    const cover = Buffer.from([0xff, 0xd8, 0xff]);
    const metadata = new ExtractedMetadata({
      title: 'Dune',
      authors: ['Frank Herbert'],
      isbn: '0-441-17242-7',
      publisher: 'Chilton Books',
      pubDate: '1965-08-01',
      language: 'en',
      description: 'A desert planet saga.',
      cover,
      coverMimeType: 'image/jpeg',
    });

    expect(metadata.props.title).toBe('Dune');
    expect(metadata.props.authors).toEqual(['Frank Herbert']);
    expect(metadata.props.isbn).toBe('0-441-17242-7');
    expect(metadata.props.publisher).toBe('Chilton Books');
    expect(metadata.props.pubDate).toBe('1965-08-01');
    expect(metadata.props.language).toBe('en');
    expect(metadata.props.description).toBe('A desert planet saga.');
    expect(metadata.props.cover).toEqual(cover);
    expect(metadata.props.coverMimeType).toBe('image/jpeg');
  });

  it('should throw an error if the title is empty', () => {
    expect(() =>
      new ExtractedMetadata({ title: '  ', authors: ['Frank Herbert'] }),
    ).toThrow('ExtractedMetadata title cannot be empty');
  });

  it('should throw an error if any author is empty', () => {
    expect(() =>
      new ExtractedMetadata({ title: 'Dune', authors: ['', 'Frank Herbert'] }),
    ).toThrow('ExtractedMetadata author at index 0 cannot be empty');
  });

  it('should throw an error when a cover is provided without a mime type', () => {
    expect(() =>
      new ExtractedMetadata({
        title: 'Dune',
        authors: ['Frank Herbert'],
        cover: Buffer.from([0xff]),
      }),
    ).toThrow('ExtractedMetadata coverMimeType is required when a cover is set');
  });

  it('should allow a metadata without cover', () => {
    const metadata = new ExtractedMetadata({
      title: 'Dune',
      authors: ['Frank Herbert'],
    });
    expect(metadata.props.cover).toBeUndefined();
    expect(metadata.props.coverMimeType).toBeUndefined();
  });

  it('should map a raw worker payload into the value object via fromRaw', () => {
    const metadata = ExtractedMetadata.fromRaw({
      title: 'Dune',
      authors: ['Frank Herbert'],
      isbn: '0-441-17242-7',
    });

    expect(metadata).toBeInstanceOf(ExtractedMetadata);
    expect(metadata.props.title).toBe('Dune');
    expect(metadata.props.authors).toEqual(['Frank Herbert']);
    expect(metadata.props.isbn).toBe('0-441-17242-7');
  });

  it('should expose a serialisable payload via toPayload', () => {
    const metadata = new ExtractedMetadata({
      title: 'Dune',
      authors: ['Frank Herbert'],
      isbn: '0-441-17242-7',
    });

    const payload = metadata.toPayload();
    expect(payload.title).toBe('Dune');
    expect(payload.authors).toEqual(['Frank Herbert']);
    expect(payload.isbn).toBe('0-441-17242-7');
  });
});