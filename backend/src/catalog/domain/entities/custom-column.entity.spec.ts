import { CustomColumn } from './custom-column.entity';

describe('CustomColumn Entity', () => {
  it('should create a valid custom column', () => {
    const column = new CustomColumn({ name: '#read_status', value: 'Read' });
    expect(column.props.name).toBe('#read_status');
    expect(column.props.value).toBe('Read');
    expect(column.id).toBeDefined();
  });

  it('should default to string when creating', () => {
    const column = new CustomColumn({ name: '#read_status', value: 'Read' });
    expect(column.props.dataType).toBe('string');
  });

  it('should throw an error if name is empty', () => {
    expect(() => new CustomColumn({ name: '', value: 'Read' })).toThrow('CustomColumn name cannot be empty');
  });
});
