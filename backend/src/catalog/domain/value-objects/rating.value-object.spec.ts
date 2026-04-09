import { Rating } from './rating.value-object';

describe('Rating ValueObject', () => {
  it('should create a valid rating between 0 and 5', () => {
    const validRatings = [0, 2.5, 5];
    validRatings.forEach(value => {
      const rating = new Rating({ value });
      expect(rating.props.value).toBe(value);
    });
  });

  it('should throw an error if rating is less than 0', () => {
    expect(() => new Rating({ value: -1 })).toThrow('Rating must be between 0 and 5');
  });

  it('should throw an error if rating is greater than 5', () => {
    expect(() => new Rating({ value: 6 })).toThrow('Rating must be between 0 and 5');
  });
});
