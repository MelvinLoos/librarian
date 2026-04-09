export class FormatConversionRequestedEvent {
  constructor(
    public readonly assetId: string,
    public readonly targetMimeType: string,
  ) {}
}
