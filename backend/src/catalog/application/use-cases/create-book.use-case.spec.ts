import { CreateBookUseCase } from './create-book.use-case';
import { IBookRepository } from '../ports/book.repository.interface';
import { Book } from '../../domain/book.aggregate';

describe('CreateBookUseCase', () => {
  let useCase: CreateBookUseCase;
  let repository: jest.Mocked<IBookRepository>;

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
    };
    useCase = new CreateBookUseCase(repository);
  });

  it('should successfully create a book and save it to the repository', async () => {
    const command = {
      title: 'The Silmarillion',
      sortTitle: 'Silmarillion, The',
      pubdate: new Date('1977-09-15'),
      hasCover: true,
    };

    const result = await useCase.execute(command);

    expect(result).toBeInstanceOf(Book);
    expect(result.props.title).toBe(command.title);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledWith(result);
  });

  it('should create a book with minimal info', async () => {
    const command = { title: 'Minimal Book' };
    const result = await useCase.execute(command);
    
    expect(result.props.title).toBe('Minimal Book');
    expect(repository.save).toHaveBeenCalledTimes(1);
  });
});
