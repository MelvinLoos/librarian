export interface DomainEvent {
  occurredOn: Date;
  getName(): string;
}
