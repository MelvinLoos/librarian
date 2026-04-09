import { Author } from './author.entity';

describe('Author Entity', () => {
  it('should create a valid author', () => {
    const author = new Author({ name: 'J.R.R. Tolkien', sort: 'Tolkien, J.R.R.', link: 'https://wikipedia.org' });
    expect(author.props.name).toBe('J.R.R. Tolkien');
    expect(author.props.sort).toBe('Tolkien, J.R.R.');
    expect(author.props.link).toBe('https://wikipedia.org');
    expect(author.id).toBeDefined();
  });

  it('should throw an error if name is empty', () => {
    expect(() => new Author({ name: '' })).toThrow('Author name cannot be empty');
  });
});
