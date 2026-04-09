import { MetadataExtractedEvent } from './metadata-extracted.event';

describe('MetadataExtractedEvent', () => {
  it('should create a MetadataExtractedEvent with the given properties', () => {
    const event = new MetadataExtractedEvent(
      'asset-123',
      { title: 'My Book', author: 'Author' },
      1,
    );

    expect(event.assetId).toBe('asset-123');
    expect(event.metadata).toEqual({ title: 'My Book', author: 'Author' });
    expect(event.bookId).toBe(1);
  });

  it('should create a MetadataExtractedEvent without a bookId', () => {
    const event = new MetadataExtractedEvent(
      'asset-123',
      { title: 'My Book', author: 'Author' }
    );

    expect(event.assetId).toBe('asset-123');
    expect(event.metadata).toEqual({ title: 'My Book', author: 'Author' });
    expect(event.bookId).toBeUndefined();
  });
});
