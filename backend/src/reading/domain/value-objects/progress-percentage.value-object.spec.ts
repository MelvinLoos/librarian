import { ProgressPercentage } from './progress-percentage.value-object';

describe('ProgressPercentage (Value Object)', () => {
  describe('create', () => {
    it('should create a ProgressPercentage from a valid value', () => {
      const percentage = ProgressPercentage.create(42.5);
      expect(percentage.value).toBe(42.5);
    });

    it('should accept 0 as a valid value', () => {
      const percentage = ProgressPercentage.create(0);
      expect(percentage.value).toBe(0);
    });

    it('should accept 100 as a valid value', () => {
      const percentage = ProgressPercentage.create(100);
      expect(percentage.value).toBe(100);
    });

    it('should throw when the value is negative', () => {
      expect(() => ProgressPercentage.create(-0.1)).toThrow(
        new Error('Percentage must be between 0 and 100'),
      );
    });

    it('should throw when the value exceeds 100', () => {
      expect(() => ProgressPercentage.create(100.01)).toThrow(
        new Error('Percentage must be between 0 and 100'),
      );
    });

    it('should throw when the value is NaN', () => {
      expect(() => ProgressPercentage.create(Number.NaN)).toThrow(
        new Error('Percentage must be a finite number'),
      );
    });

    it('should throw when the value is not a number', () => {
      expect(() =>
        ProgressPercentage.create('42' as unknown as number),
      ).toThrow(new Error('Percentage must be a finite number'));
    });
  });

  describe('equals', () => {
    it('should return true for identical percentages', () => {
      expect(
        ProgressPercentage.create(10).equals(ProgressPercentage.create(10)),
      ).toBe(true);
    });

    it('should return false for different percentages', () => {
      expect(
        ProgressPercentage.create(10).equals(ProgressPercentage.create(20)),
      ).toBe(false);
    });
  });

  describe('isComplete', () => {
    it('should return true at 100', () => {
      expect(ProgressPercentage.create(100).isComplete()).toBe(true);
    });

    it('should return false below 100', () => {
      expect(ProgressPercentage.create(99.9).isComplete()).toBe(false);
    });
  });
});
