import { FormatConversionRequestedEvent } from './format-conversion-requested.event';

describe('FormatConversionRequestedEvent', () => {
  it('should create a FormatConversionRequestedEvent with the given properties', () => {
    const event = new FormatConversionRequestedEvent(
      'asset-123',
      'application/pdf',
    );

    expect(event.assetId).toBe('asset-123');
    expect(event.targetMimeType).toBe('application/pdf');
    expect(event.occurredOn).toBeInstanceOf(Date);
    expect(event.getName()).toBe('FormatConversionRequestedEvent');
  });
});
