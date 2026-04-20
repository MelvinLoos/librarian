import { MetadataExtractedEvent } from './metadata-extracted.event';
import { AssetProcessingState } from '../asset-processing-state.enum';

describe('MetadataExtractedEvent', () => {
  it('should create a MetadataExtractedEvent with the given properties', () => {
    const event = new MetadataExtractedEvent(
      'asset-123',
      AssetProcessingState.READY,
    );

    expect(event.assetId).toBe('asset-123');
    expect(event.state).toBe(AssetProcessingState.READY);
    expect(event.occurredOn).toBeInstanceOf(Date);
    expect(event.getName()).toBe('MetadataExtractedEvent');
  });
});
