import { DomainEvent } from '../../../shared/domain/domain-event';
import { AssetProcessingState } from '../asset-processing-state.enum';

export class AssetUploadedEvent implements DomainEvent {
  public readonly occurredOn: Date;

  constructor(
    public readonly assetId: string,
    public readonly filePath: string,
    public readonly mimeType: string,
    public readonly byteSize: number,
    public readonly state: AssetProcessingState,
  ) {
    this.occurredOn = new Date();
  }

  getName(): string {
    return 'AssetUploadedEvent';
  }
}
