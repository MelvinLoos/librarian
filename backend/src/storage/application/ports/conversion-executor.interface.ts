export interface ConversionJobInput {
  jobId: string;
  sourceAbsolutePath: string;
  sourceFormat: string;
  targetFormat: string;
  outputRelativePath: string;
}

/**
 * Adapter boundary for the CPU-heavy conversion execution (piscina worker).
 * Implementations MUST throw when the conversion fails.
 */
export interface IConversionExecutor {
  convert(input: ConversionJobInput): Promise<void>;
}