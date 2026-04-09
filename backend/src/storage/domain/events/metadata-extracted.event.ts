export class MetadataExtractedEvent {
  constructor(
    public readonly assetId: string,
    public readonly metadata: Record<string, any>,
    public readonly bookId?: number,
  ) {}
}
