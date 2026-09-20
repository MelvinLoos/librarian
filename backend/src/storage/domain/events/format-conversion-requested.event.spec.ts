import { FormatConversionRequestedEvent } from './format-conversion-requested.event';

describe('FormatConversionRequestedEvent', () => {
  it('should create a FormatConversionRequestedEvent with the given properties', () => {
    const event = new FormatConversionRequestedEvent(
      'job-1',
      42,
      'EPUB',
      'MOBI',
    );

    expect(event.jobId).toBe('job-1');
    expect(event.bookId).toBe(42);
    expect(event.sourceFormat).toBe('EPUB');
    expect(event.targetFormat).toBe('MOBI');
    expect(event.occurredOn).toBeInstanceOf(Date);
    expect(event.getName()).toBe('FormatConversionRequestedEvent');
  });
});
