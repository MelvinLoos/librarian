import { Series } from './series.entity';

describe('Series Entity', () => {
  it('should create a valid series', () => {
    const series = new Series({ name: 'The Lord of the Rings', index: 1 });
    expect(series.props.name).toBe('The Lord of the Rings');
    expect(series.props.index).toBe(1);
    expect(series.id).toBeDefined();
  });

  it('should throw an error if name is empty', () => {
    expect(() => new Series({ name: '', index: 1 })).toThrow('Series name cannot be empty');
  });

  it('should default to index 1 if not provided', () => {
    const series = new Series({ name: 'The Lord of the Rings' });
    expect(series.props.index).toBe(1);
  });
});
