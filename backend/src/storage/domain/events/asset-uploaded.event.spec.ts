import { AssetUploadedEvent } from './asset-uploaded.event';

describe('AssetUploadedEvent', () => {
  it('should create an AssetUploadedEvent with the given properties', () => {
    const event = new AssetUploadedEvent(
      'asset-123',
      'books/1.epub',
      'application/epub+zip',
      1024,
    );

    expect(event.assetId).toBe('asset-123');
    expect(event.filePath).toBe('books/1.epub');
    expect(event.mimeType).toBe('application/epub+zip');
    expect(event.byteSize).toBe(1024);
    expect(event.occurredOn).toBeInstanceOf(Date);
    expect(event.getName()).toBe('AssetUploadedEvent');
  });
});
