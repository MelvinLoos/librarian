import { Shelf } from './shelf.entity';

describe('Shelf Entity', () => {
  it('should create a valid shelf', () => {
    const shelf = new Shelf({ name: 'Favorites', userId: 'user-123' });
    expect(shelf.props.name).toBe('Favorites');
    expect(shelf.props.userId).toBe('user-123');
    expect(shelf.id).toBeDefined();
  });

  it('should throw an error if name is empty', () => {
    expect(() => new Shelf({ name: '', userId: 'user-1' })).toThrow('Shelf name cannot be empty');
  });

  it('should throw an error if userId is empty', () => {
    expect(() => new Shelf({ name: 'Fav', userId: '' })).toThrow('Shelf userId cannot be empty');
  });
});
