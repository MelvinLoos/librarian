import { FilePath } from './value-objects/file-path.value-object';
import { MimeType } from './value-objects/mime-type.value-object';
import { ByteSize } from './value-objects/byte-size.value-object';
import { DomainEvent } from '../../shared/domain/domain-event';
import { AssetUploadedEvent } from './events/asset-uploaded.event';
import { MetadataExtractedEvent } from './events/metadata-extracted.event';
import { FormatConversionRequestedEvent } from './events/format-conversion-requested.event';

export type AssetType = 'FORMAT' | 'COVER';

export class Asset {
  private _domainEvents: DomainEvent[] = [];

  private constructor(
    private readonly _id: string,
    private readonly _type: AssetType,
    private _filePath: FilePath,
    private _mimeType: MimeType,
    private _byteSize: ByteSize,
    private _bookId?: number
  ) { }

  public static upload(
    id: string,
    type: AssetType,
    filePath: FilePath,
    mimeType: MimeType,
    byteSize: ByteSize
  ): Asset {
    const asset = new Asset(id, type, filePath, mimeType, byteSize);
    asset.addDomainEvent(
      new AssetUploadedEvent(id, filePath.value, mimeType.value, byteSize.value)
    );
    return asset;
  }

  public static reconstruct(
    id: string,
    type: AssetType,
    filePath: FilePath,
    mimeType: MimeType,
    byteSize: ByteSize,
    bookId?: number
  ): Asset {
    return new Asset(id, type, filePath, mimeType, byteSize, bookId);
  }

  get id(): string {
    return this._id;
  }

  get type(): AssetType {
    return this._type;
  }

  get filePath(): FilePath {
    return this._filePath;
  }

  get mimeType(): MimeType {
    return this._mimeType;
  }

  get byteSize(): ByteSize {
    return this._byteSize;
  }

  get bookId(): number | undefined {
    return this._bookId;
  }

  public linkToBook(bookId: number): void {
    if (this._bookId && this._bookId !== bookId) {
      throw new Error('Asset is already linked to a different book');
    }
    this._bookId = bookId;
  }

  public extractMetadata(metadata: Record<string, any>, bookId?: number): void {
    if (this._type !== 'FORMAT') {
      throw new Error('Can only extract metadata from FORMAT assets');
    }
    if (bookId) {
      this.linkToBook(bookId);
    }
    this.addDomainEvent(new MetadataExtractedEvent(this._id, metadata, bookId));
  }

  public requestFormatConversion(targetMimeType: MimeType): void {
    if (this._type !== 'FORMAT') {
      throw new Error('Can only request format conversion for FORMAT assets');
    }
    this.addDomainEvent(new FormatConversionRequestedEvent(this._id, targetMimeType.value));
  }

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }

  private addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }
}
