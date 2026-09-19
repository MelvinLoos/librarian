import { CustomColumn } from './custom-column.entity';

describe('CustomColumn Entity', () => {
  it('should create a valid custom column', () => {
    const column = new CustomColumn({ name: '#read_status', value: 'Read' });
    expect(column.props.name).toBe('#read_status');
    expect(column.props.value).toBe('Read');
    expect(column.id).toBeDefined();
  });

  it('should default to text datatype when creating', () => {
    const column = new CustomColumn({ name: '#read_status', value: 'Read' });
    expect(column.props.dataType).toBe('text');
  });

  it('should default isMultiple to false and expose the display label', () => {
    const column = new CustomColumn({
      name: '#genre',
      value: 'Sci-Fi',
      displayLabel: 'Genre',
    });
    expect(column.props.isMultiple).toBe(false);
    expect(column.props.displayLabel).toBe('Genre');
  });

  it('should support every declared datatype', () => {
    for (const dataType of [
      'text',
      'series',
      'number',
      'rating',
      'date',
      'boolean',
    ]) {
      const column = new CustomColumn({ name: `#col_${dataType}`, value: 'x', dataType });
      expect(column.props.dataType).toBe(dataType);
    }
  });

  it('should reject an unknown datatype', () => {
    expect(() =>
      new CustomColumn({ name: '#bad', value: 'x', dataType: 'json' }),
    ).toThrow('CustomColumn dataType must be one of: text, series, number, rating, date, boolean');
  });

  it('should support the isMultiple flag', () => {
    const column = new CustomColumn({
      name: '#tags2',
      value: 'a|b',
      dataType: 'text',
      isMultiple: true,
    });
    expect(column.props.isMultiple).toBe(true);
  });

  it('should throw an error if name is empty', () => {
    expect(() => new CustomColumn({ name: '', value: 'Read' })).toThrow(
      'CustomColumn name cannot be empty',
    );
  });
});
