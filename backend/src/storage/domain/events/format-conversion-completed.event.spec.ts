import { FormatConversionCompletedEvent } from './format-conversion-completed.event';

describe('FormatConversionCompletedEvent', () => {
  it('should create a success event with the given properties', () => {
    const event = new FormatConversionCompletedEvent(
      'job-1',
      true,
      'EPUB',
      'MOBI',
      '.librarian/conversions/job-1.mobi',
    );

    expect(event.jobId).toBe('job-1');
    expect(event.success).toBe(true);
    expect(event.sourceFormat).toBe('EPUB');
    expect(event.targetFormat).toBe('MOBI');
    expect(event.outputPath).toBe('.librarian/conversions/job-1.mobi');
    expect(event.errorMessage).toBeUndefined();
    expect(event.occurredOn).toBeInstanceOf(Date);
    expect(event.getName()).toBe('FormatConversionCompletedEvent');
  });

  it('should create a failure event carrying the error message', () => {
    const event = new FormatConversionCompletedEvent(
      'job-1',
      false,
      'EPUB',
      'MOBI',
      undefined,
      'Calibre ebook-convert CLI is not installed',
    );

    expect(event.success).toBe(false);
    expect(event.outputPath).toBeUndefined();
    expect(event.errorMessage).toBe(
      'Calibre ebook-convert CLI is not installed',
    );
  });
});
