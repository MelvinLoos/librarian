import { FilePath } from './value-objects/file-path.value-object';
import { MimeType } from './value-objects/mime-type.value-object';
import { ByteSize } from './value-objects/byte-size.value-object';
import { DomainEvent } from '../../shared/domain/domain-event';
import { AssetUploadedEvent } from './events/asset-uploaded.event';
import { MetadataExtractedEvent } from './events/metadata-extracted.event';
import { FormatConversionRequestedEvent } from './events/format-conversion-requested.event';
import { AssetProcessingState } from './asset-processing-state.enum';

export type AssetType = 'FORMAT' | 'COVER';

export class Asset {
  private _domainEvents: DomainEvent[] = [];

  private constructor(
    private readonly _id: string,
    private readonly _type: AssetType,
    private _filePath: FilePath,
    private _mimeType: MimeType,
    private _byteSize: ByteSize,
    private _state: AssetProcessingState,
    private _bookId?: number,
    private _failureReason?: string,
  ) { }

  public static upload(
    id: string,
    type: AssetType,
    filePath: FilePath,
    mimeType: MimeType,
    byteSize: ByteSize,
  ): Asset {
    const asset = new Asset(id, type, filePath, mimeType, byteSize, AssetProcessingState.UPLOADED);
    asset.addDomainEvent(
      new AssetUploadedEvent(
        id,
        filePath.value,
        mimeType.value,
        byteSize.value,
        AssetProcessingState.UPLOADED,
      ),
    );
    return asset;
  }

  public static reconstruct(
    id: string,
    type: AssetType,
    filePath: FilePath,
    mimeType: MimeType,
    byteSize: ByteSize,
    state: AssetProcessingState,
    bookId?: number,
    failureReason?: string,
  ): Asset {
    return new Asset(id, type, filePath, mimeType, byteSize, state, bookId, failureReason);
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

  get state(): AssetProcessingState {
    return this._state;
  }

  get failureReason(): string | undefined {
    return this._failureReason;
  }

  public startProcessing(): void {
    if (this._state !== AssetProcessingState.UPLOADED) {
      throw new Error('Asset must be in UPLOADED state to start processing');
    }
    this._state = AssetProcessingState.PROCESSING;
  }

  public markAsReady(): void {
    if (this._state !== AssetProcessingState.PROCESSING) {
      throw new Error('Asset must be in PROCESSING state to be marked as ready');
    }
    this._state = AssetProcessingState.READY;
    this.addDomainEvent(new MetadataExtractedEvent(this._id, AssetProcessingState.READY));
  }

  public markAsFailed(reason: string): void {
    if (this._state === AssetProcessingState.READY) {
      throw new Error('Asset cannot be marked as failed if it is already READY');
    }
    this._state = AssetProcessingState.FAILED;
    this._failureReason = reason;
  }

  public linkToBook(bookId: number): void {
    if (this._bookId && this._bookId !== bookId) {
      throw new Error('Asset is already linked to a different book');
    }
    this._bookId = bookId;
  }

  public requestFormatConversion(targetMimeType: MimeType): void {
    if (this._type !== 'FORMAT') {
      throw new Error('Can only request format conversion for FORMAT assets');
    }
    if (this._state !== AssetProcessingState.READY) {
      throw new Error('Asset must be in READY state to request format conversion');
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
