import { Tag } from './tag.entity';

describe('Tag Entity', () => {
  it('should create a valid tag', () => {
    const tag = new Tag({ name: 'Fantasy' });
    expect(tag.props.name).toBe('Fantasy');
    expect(tag.id).toBeDefined();
  });

  it('should throw an error if name is empty', () => {
    expect(() => new Tag({ name: '  ' })).toThrow('Tag name cannot be empty');
  });
});
