import { Entity } from './entity';
import { ValueObject } from './value-object';
import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from './domain-event';

class MockEntity extends Entity<{ name: string }> {}
class MockValueObject extends ValueObject<{ value: string }> {}
class MockEvent implements DomainEvent {
  occurredOn = new Date();
  getName() { return 'MockEvent'; }
}
class MockAggregate extends AggregateRoot<{ name: string }> {}

describe('Shared Domain Primitives', () => {
  describe('Entity', () => {
    it('should identify that two entities with the same ID are equal', () => {
      const id = 'test-id';
      const entity1 = new MockEntity({ name: 'A' }, id);
      const entity2 = new MockEntity({ name: 'B' }, id);
      expect(entity1.equals(entity2)).toBe(true);
    });

    it('should identify that two entities with different IDs are not equal', () => {
      const entity1 = new MockEntity({ name: 'A' });
      const entity2 = new MockEntity({ name: 'A' });
      expect(entity1.equals(entity2)).toBe(false);
    });

    it('should return false when comparing with null or undefined', () => {
      const entity = new MockEntity({ name: 'A' });
      expect(entity.equals(undefined)).toBe(false);
      expect(entity.equals(null as any)).toBe(false);
    });

    it('should return true when comparing with itself', () => {
      const entity = new MockEntity({ name: 'A' });
      expect(entity.equals(entity)).toBe(true);
    });

    it('should return false when comparing with non-entity', () => {
      const entity = new MockEntity({ name: 'A' });
      expect(entity.equals({ id: entity.id } as any)).toBe(false);
    });
  });

  describe('ValueObject', () => {
    it('should identify that two value objects with same props are equal', () => {
      const vo1 = new MockValueObject({ value: 'v' });
      const vo2 = new MockValueObject({ value: 'v' });
      expect(vo1.equals(vo2)).toBe(true);
    });

    it('should identify that two value objects with different props are not equal', () => {
      const vo1 = new MockValueObject({ value: 'v1' });
      const vo2 = new MockValueObject({ value: 'v2' });
      expect(vo1.equals(vo2)).toBe(false);
    });

    it('should return false when comparing with null or undefined', () => {
      const vo = new MockValueObject({ value: 'v' });
      expect(vo.equals(undefined)).toBe(false);
    });
  });

  describe('AggregateRoot', () => {
    it('should manage domain events', () => {
      const aggregate = new MockAggregate({ name: 'Agg' });
      const event = new MockEvent();
      
      // Accessing protected addDomainEvent via hack for testing or just test public interface
      (aggregate as any).addDomainEvent(event);
      
      expect(aggregate.domainEvents).toHaveLength(1);
      expect(aggregate.domainEvents[0]).toBe(event);
      
      aggregate.clearEvents();
      expect(aggregate.domainEvents).toHaveLength(0);
    });
  });
});
