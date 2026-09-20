import { MetadataExtractionPoolAdapter } from './metadata-extraction-pool.adapter';
import { ExtractedMetadata } from '../domain/value-objects/extracted-metadata.value-object';
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

    (Piscina as jest.MockedClass<typeof Piscina>).mockImplementation(
      () => mockPiscinaInstance as any,
    );

    adapter = new MetadataExtractionPoolAdapter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('extract', () => {
    it('should return ExtractedMetadata when the worker reports success', async () => {
      const filePath = '/path/to/test-book.epub';
      mockPiscinaInstance.run.mockResolvedValue({
        success: true,
        metadata: {
          title: 'Dune',
          authors: ['Frank Herbert'],
          publisher: 'Chilton Books',
        },
      } as never);

      const result = await adapter.extract(filePath);

      expect(mockPiscinaInstance.run).toHaveBeenCalledWith(filePath);
      expect(result).toBeInstanceOf(ExtractedMetadata);
      expect(result.props.title).toBe('Dune');
      expect(result.props.authors).toEqual(['Frank Herbert']);
      expect(result.props.publisher).toBe('Chilton Books');
    });

    it('should throw an error if the worker returns a failure', async () => {
      const filePath = '/path/to/error-book.epub';
      mockPiscinaInstance.run.mockResolvedValue({
        success: false,
        reason: 'Simulated worker error',
      } as never);

      await expect(adapter.extract(filePath)).rejects.toThrow(
        'Simulated worker error',
      );
      expect(mockPiscinaInstance.run).toHaveBeenCalledWith(filePath);
    });
  });

  it('should destroy the piscina pool on module destroy', () => {
    adapter.onModuleDestroy();
    expect(mockPiscinaInstance.destroy).toHaveBeenCalledTimes(1);
  });
});
