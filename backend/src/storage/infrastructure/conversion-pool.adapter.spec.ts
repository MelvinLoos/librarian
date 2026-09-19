import { ConversionPoolAdapter } from './conversion-pool.adapter';
import { ConversionJobInput } from '../application/ports/conversion-executor.interface';
import Piscina from 'piscina';

jest.mock('piscina');

describe('ConversionPoolAdapter', () => {
  let adapter: ConversionPoolAdapter;
  let mockPiscinaInstance: { run: jest.Mock; destroy: jest.Mock };

  const input: ConversionJobInput = {
    jobId: 'job-1',
    sourceAbsolutePath: '/tmp/main.epub',
    sourceFormat: 'EPUB',
    targetFormat: 'MOBI',
    outputRelativePath: '.librarian/conversions/job-1.mobi',
  };

  beforeEach(() => {
    mockPiscinaInstance = {
      run: jest.fn(),
      destroy: jest.fn(),
    };

    (Piscina as jest.MockedClass<typeof Piscina>).mockImplementation(
      () => mockPiscinaInstance as any,
    );

    adapter = new ConversionPoolAdapter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve when the worker reports success', async () => {
    mockPiscinaInstance.run.mockResolvedValue({ success: true } as never);

    await adapter.convert(input);

    expect(mockPiscinaInstance.run).toHaveBeenCalledWith(input);
  });

  it('should throw when the worker reports a failure', async () => {
    mockPiscinaInstance.run.mockResolvedValue({
      success: false,
      errorMessage: 'Calibre ebook-convert CLI is not installed',
    } as never);

    await expect(adapter.convert(input)).rejects.toThrow(
      'Calibre ebook-convert CLI is not installed',
    );
    expect(mockPiscinaInstance.run).toHaveBeenCalledWith(input);
  });

  it('should destroy the piscina pool on module destroy', () => {
    adapter.onModuleDestroy();
    expect(mockPiscinaInstance.destroy).toHaveBeenCalledTimes(1);
  });
});