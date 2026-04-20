import extractMetadata from './metadata-extractor.worker';

describe('metadata-extractor.worker', () => {
  it('should extract mock metadata successfully', async () => {
    const filePath = '/path/to/test-book.epub';
    const result = await extractMetadata(filePath);

    expect(result.success).toBe(true);
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.title).toBe('Mock Title for test-book.epub');
    expect(result.metadata?.author).toBe('Mock Author for test-book.epub');
  });

  it('should handle different file paths', async () => {
    const filePath = '/path/to/another-book.pdf';
    const result = await extractMetadata(filePath);

    expect(result.success).toBe(true);
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.title).toBe('Mock Title for another-book.pdf');
    expect(result.metadata?.author).toBe('Mock Author for another-book.pdf');
  });
});
