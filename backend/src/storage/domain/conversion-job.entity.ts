import { ConversionStatus } from './conversion-status.enum';

export interface ConversionJobProps {
  id: string;
  bookId: number;
  sourceFormat: string;
  targetFormat: string;
  status?: ConversionStatus;
  progress?: number;
  errorMessage?: string;
  outputPath?: string;
  requestedAt?: Date;
  updatedAt?: Date;
}

export class ConversionJob {
  constructor(public readonly props: ConversionJobProps) {}

  markRunning(): void {
    throw new Error('Not implemented');
  }

  markCompleted(outputPath: string): void {
    throw new Error('Not implemented');
  }

  markFailed(reason: string): void {
    throw new Error('Not implemented');
  }

  cancel(): void {
    throw new Error('Not implemented');
  }
}