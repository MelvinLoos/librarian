import { Asset } from './asset.aggregate';
import { FilePath } from './value-objects/file-path.value-object';
import { MimeType } from './value-objects/mime-type.value-object';
import { ByteSize } from './value-objects/byte-size.value-object';
import { AssetUploadedEvent } from './events/asset-uploaded.event';
import { MetadataExtractedEvent } from './events/metadata-extracted.event';
import { FormatConversionRequestedEvent } from './events/format-conversion-requested.event';

describe('Asset Aggregate Root', () => {
  const id = 'asset-1';
  const filePath = new FilePath('books/1/book.epub');
  const mimeType = new MimeType('application/epub+zip');
  const byteSize = new ByteSize(1024);

  describe('upload', () => {
    it('should create an asset and append AssetUploadedEvent', () => {
      const asset = Asset.upload(id, 'FORMAT', filePath, mimeType, byteSize);

      expect(asset.id).toBe(id);
      expect(asset.type).toBe('FORMAT');
      expect(asset.filePath.equals(filePath)).toBe(true);
      expect(asset.mimeType.equals(mimeType)).toBe(true);
      expect(asset.byteSize.equals(byteSize)).toBe(true);
      expect(asset.bookId).toBeUndefined();

      const events = asset.domainEvents;
      expect(events.length).toBe(1);
      const event = events[0] as AssetUploadedEvent;
      expect(event).toBeInstanceOf(AssetUploadedEvent);
      expect(event.assetId).toBe(id);
      expect(event.filePath).toBe('books/1/book.epub');
      expect(event.mimeType).toBe('application/epub+zip');
      expect(event.byteSize).toBe(1024);
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct an asset without appending events', () => {
      const asset = Asset.reconstruct(id, 'COVER', filePath, mimeType, byteSize, 100);

      expect(asset.id).toBe(id);
      expect(asset.type).toBe('COVER');
      expect(asset.bookId).toBe(100);
      expect(asset.domainEvents.length).toBe(0);
    });
  });

  describe('linkToBook', () => {
    it('should link the asset to a bookId', () => {
      const asset = Asset.upload(id, 'FORMAT', filePath, mimeType, byteSize);
      asset.linkToBook(42);
      expect(asset.bookId).toBe(42);
    });

    it('should allow linking to the same bookId Multiple times', () => {
      const asset = Asset.upload(id, 'FORMAT', filePath, mimeType, byteSize);
      asset.linkToBook(42);
      asset.linkToBook(42);
      expect(asset.bookId).toBe(42);
    });

    it('should throw an error if already linked to a different bookId', () => {
      const asset = Asset.upload(id, 'FORMAT', filePath, mimeType, byteSize);
      asset.linkToBook(42);
      expect(() => asset.linkToBook(99)).toThrow('Asset is already linked to a different book');
    });
  });

  describe('extractMetadata', () => {
    it('should extract metadata and append MetadataExtractedEvent', () => {
      const asset = Asset.upload(id, 'FORMAT', filePath, mimeType, byteSize);
      asset.clearEvents();

      const metadata = { title: 'Test' };
      asset.extractMetadata(metadata, 42);

      expect(asset.bookId).toBe(42);
      const events = asset.domainEvents;
      expect(events.length).toBe(1);
      
      const event = events[0] as MetadataExtractedEvent;
      expect(event).toBeInstanceOf(MetadataExtractedEvent);
      expect(event.assetId).toBe(id);
      expect(event.metadata).toEqual(metadata);
      expect(event.bookId).toBe(42);
    });

    it('should throw an error if asset type is COVER', () => {
      const asset = Asset.upload(id, 'COVER', filePath, mimeType, byteSize);
      expect(() => asset.extractMetadata({})).toThrow('Can only extract metadata from FORMAT assets');
    });
  });

  describe('requestFormatConversion', () => {
    it('should request format conversion and append FormatConversionRequestedEvent', () => {
      const asset = Asset.upload(id, 'FORMAT', filePath, mimeType, byteSize);
      asset.clearEvents();

      const targetMimeType = new MimeType('application/pdf');
      asset.requestFormatConversion(targetMimeType);

      const events = asset.domainEvents;
      expect(events.length).toBe(1);

      const event = events[0] as FormatConversionRequestedEvent;
      expect(event).toBeInstanceOf(FormatConversionRequestedEvent);
      expect(event.assetId).toBe(id);
      expect(event.targetMimeType).toBe('application/pdf');
    });

    it('should throw an error if asset type is COVER', () => {
      const asset = Asset.upload(id, 'COVER', filePath, mimeType, byteSize);
      const targetMimeType = new MimeType('application/pdf');
      expect(() => asset.requestFormatConversion(targetMimeType)).toThrow('Can only request format conversion for FORMAT assets');
    });
  });

  describe('events management', () => {
    it('should clear domain events', () => {
      const asset = Asset.upload(id, 'FORMAT', filePath, mimeType, byteSize);
      expect(asset.domainEvents.length).toBe(1);
      asset.clearEvents();
      expect(asset.domainEvents.length).toBe(0);
    });
  });
});
