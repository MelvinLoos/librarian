import { MetadataExtractionPoolAdapter } from './metadata-extraction-pool.adapter';
import Piscina from 'piscina';

jest.mock('piscina');

describe('MetadataExtractionPoolAdapter', () => {
  let adapter: MetadataExtractionPoolAdapter;
  let mockPiscinaInstance: { run: jest.Mock; destroy: jest.Mock };

  beforeEach(() => {
    mockPiscinaInstance = {
      run: jest.fn(),
      destroy: jest.fn(),
    };

    (Piscina as jest.MockedClass<typeof Piscina>).mockImplementation(() => mockPiscinaInstance as any);

    adapter = new MetadataExtractionPoolAdapter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should extract metadata successfully', async () => {
    const filePath = '/path/to/test-book.epub';
    mockPiscinaInstance.run.mockResolvedValue({
      success: true,
      metadata: { title: 'Mock Title for test-book.epub', author: 'Mock Author for test-book.epub' },
    });

    const result = await adapter.extractMetadata(filePath);

    expect(mockPiscinaInstance.run).toHaveBeenCalledWith(filePath);
    expect(result).toEqual({ title: 'Mock Title for test-book.epub', author: 'Mock Author for test-book.epub' });
  });

  it('should throw an error if worker returns a failure', async () => {
    const filePath = '/path/to/error-book.epub';
    mockPiscinaInstance.run.mockResolvedValue({
      success: false,
      reason: 'Simulated worker error',
    });

    await expect(adapter.extractMetadata(filePath)).rejects.toThrow('Simulated worker error');
    expect(mockPiscinaInstance.run).toHaveBeenCalledWith(filePath);
  });

  it('should destroy the piscina pool on module destroy', () => {
    adapter.onModuleDestroy();
    expect(mockPiscinaInstance.destroy).toHaveBeenCalledTimes(1);
  });
});
