import { Author } from '../../domain/entities/author.entity';

export interface IAuthorRepository {
  findAll(): Promise<Author[]>;
}