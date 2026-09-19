import { ConversionJob } from './conversion-job.entity';
import { ConversionStatus } from './conversion-status.enum';

describe('ConversionJob Entity', () => {
  const makeJob = (overrides: Partial<ConversionJob['props']> = {}) =>
    new ConversionJob({
      id: 'job-1',
      bookId: 42,
      sourceFormat: 'EPUB',
      targetFormat: 'MOBI',
      ...overrides,
    });

  it('should create a pending job with sane defaults', () => {
    const job = makeJob();

    expect(job.props.id).toBe('job-1');
    expect(job.props.bookId).toBe(42);
    expect(job.props.sourceFormat).toBe('EPUB');
    expect(job.props.targetFormat).toBe('MOBI');
    expect(job.props.status).toBe(ConversionStatus.PENDING);
    expect(job.props.progress).toBe(0);
    expect(job.props.requestedAt).toBeInstanceOf(Date);
    expect(job.props.updatedAt).toBeInstanceOf(Date);
  });

  it('should throw when the source format is empty', () => {
    expect(() => makeJob({ sourceFormat: '' })).toThrow(
      'ConversionJob sourceFormat cannot be empty',
    );
  });

  it('should throw when the target format is empty', () => {
    expect(() => makeJob({ targetFormat: '' })).toThrow(
      'ConversionJob targetFormat cannot be empty',
    );
  });

  describe('markRunning', () => {
    it('should transition a pending job to running', () => {
      const job = makeJob();
      job.markRunning();
      expect(job.props.status).toBe(ConversionStatus.RUNNING);
    });

    it('should throw when the job is already running', () => {
      const job = makeJob({ status: ConversionStatus.RUNNING });
      expect(() => job.markRunning()).toThrow(
        'Only pending conversions can start running',
      );
    });

    it('should throw when the job is already completed', () => {
      const job = makeJob({ status: ConversionStatus.COMPLETED });
      expect(() => job.markRunning()).toThrow(
        'Only pending conversions can start running',
      );
    });
  });

  describe('markCompleted', () => {
    it('should complete a running job with progress 100 and an output path', () => {
      const job = makeJob({ status: ConversionStatus.RUNNING });
      job.markCompleted('.librarian/conversions/job-1.mobi');
      expect(job.props.status).toBe(ConversionStatus.COMPLETED);
      expect(job.props.progress).toBe(100);
      expect(job.props.outputPath).toBe('.librarian/conversions/job-1.mobi');
    });

    it('should throw when completed from the pending state', () => {
      const job = makeJob();
      expect(() => job.markCompleted('.librarian/conversions/job-1.mobi')).toThrow(
        'Only running conversions can be completed',
      );
    });
  });

  describe('markFailed', () => {
    it('should fail a pending job with an error message', () => {
      const job = makeJob();
      job.markFailed('Calibre ebook-convert CLI is not installed');
      expect(job.props.status).toBe(ConversionStatus.FAILED);
      expect(job.props.errorMessage).toBe(
        'Calibre ebook-convert CLI is not installed',
      );
    });

    it('should fail a running job with an error message', () => {
      const job = makeJob({ status: ConversionStatus.RUNNING });
      job.markFailed('Disk full');
      expect(job.props.status).toBe(ConversionStatus.FAILED);
      expect(job.props.errorMessage).toBe('Disk full');
    });

    it('should throw when the job is already completed', () => {
      const job = makeJob({ status: ConversionStatus.COMPLETED });
      expect(() => job.markFailed('boom')).toThrow(
        'Completed conversions cannot be marked as failed',
      );
    });
  });

  describe('cancel', () => {
    it('should cancel a pending job', () => {
      const job = makeJob();
      job.cancel();
      expect(job.props.status).toBe(ConversionStatus.CANCELLED);
    });

    it('should cancel a running job', () => {
      const job = makeJob({ status: ConversionStatus.RUNNING });
      job.cancel();
      expect(job.props.status).toBe(ConversionStatus.CANCELLED);
    });

    it('should throw when the job is already completed', () => {
      const job = makeJob({ status: ConversionStatus.COMPLETED });
      expect(() => job.cancel()).toThrow(
        'Only pending or running conversions can be cancelled',
      );
    });

    it('should throw when the job already failed', () => {
      const job = makeJob({ status: ConversionStatus.FAILED });
      expect(() => job.cancel()).toThrow(
        'Only pending or running conversions can be cancelled',
      );
    });
  });
});