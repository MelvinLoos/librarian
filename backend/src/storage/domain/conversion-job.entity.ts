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

/**
 * ConversionJob
 *
 * Domain entity tracking a single conversion request through its lifecycle:
 * pending → running → completed | failed, with cancel available while
 * pending/running. Pure TS — zero external dependencies.
 */
export class ConversionJob {
  props: ConversionJobProps;

  constructor(props: ConversionJobProps) {
    if (!props.sourceFormat || props.sourceFormat.trim() === '') {
      throw new Error('ConversionJob sourceFormat cannot be empty');
    }
    if (!props.targetFormat || props.targetFormat.trim() === '') {
      throw new Error('ConversionJob targetFormat cannot be empty');
    }
    this.props = {
      ...props,
      status: props.status ?? ConversionStatus.PENDING,
      progress: props.progress ?? 0,
      requestedAt: props.requestedAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  markRunning(): void {
    if (this.props.status !== ConversionStatus.PENDING) {
      throw new Error('Only pending conversions can start running');
    }
    this.touch({ status: ConversionStatus.RUNNING });
  }

  markCompleted(outputPath: string): void {
    if (this.props.status !== ConversionStatus.RUNNING) {
      throw new Error('Only running conversions can be completed');
    }
    this.touch({
      status: ConversionStatus.COMPLETED,
      progress: 100,
      outputPath,
      errorMessage: undefined,
    });
  }

  markFailed(reason: string): void {
    if (this.props.status === ConversionStatus.COMPLETED) {
      throw new Error('Completed conversions cannot be marked as failed');
    }
    this.touch({ status: ConversionStatus.FAILED, errorMessage: reason });
  }

  cancel(): void {
    if (
      this.props.status !== ConversionStatus.PENDING &&
      this.props.status !== ConversionStatus.RUNNING
    ) {
      throw new Error('Only pending or running conversions can be cancelled');
    }
    this.touch({ status: ConversionStatus.CANCELLED });
  }

  private touch(partial: Partial<ConversionJobProps>): void {
    this.props = { ...this.props, ...partial, updatedAt: new Date() };
  }
}
