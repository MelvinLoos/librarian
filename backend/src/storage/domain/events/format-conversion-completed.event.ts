import { DomainEvent } from '../../../shared/domain/domain-event';

export class FormatConversionCompletedEvent implements DomainEvent {
  public readonly occurredOn: Date;

  constructor(
    public readonly jobId: string,
    public readonly success: boolean,
    public readonly sourceFormat: string,
    public readonly targetFormat: string,
    public readonly outputPath?: string,
    public readonly errorMessage?: string,
  ) {
    this.occurredOn = new Date();
  }

  getName(): string {
    return 'FormatConversionCompletedEvent';
  }
}
