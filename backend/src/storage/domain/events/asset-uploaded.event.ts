export class AssetUploadedEvent {
  constructor(
    public readonly assetId: string,
    public readonly filePath: string,
    public readonly mimeType: string,
    public readonly byteSize: number,
  ) {}
}
