import { Identifier } from './identifier.value-object';

describe('Identifier ValueObject', () => {
  it('should create a valid identifier', () => {
    const identifier = new Identifier({ type: 'isbn', value: '978-3-16-148410-0' });
    expect(identifier.props.type).toBe('isbn');
    expect(identifier.props.value).toBe('978-3-16-148410-0');
  });

  it('should trim the value', () => {
    const identifier = new Identifier({ type: 'asin', value: '  B08FX2D214  ' });
    expect(identifier.props.value).toBe('B08FX2D214');
  });

  it('should throw an error if value is empty', () => {
    expect(() => new Identifier({ type: 'isbn', value: '' })).toThrow('Identifier value cannot be empty');
    expect(() => new Identifier({ type: 'isbn', value: '   ' })).toThrow('Identifier value cannot be empty');
  });

  it('should throw an error if type is empty', () => {
    expect(() => new Identifier({ type: '', value: '123' })).toThrow('Identifier type cannot be empty');
  });
});
