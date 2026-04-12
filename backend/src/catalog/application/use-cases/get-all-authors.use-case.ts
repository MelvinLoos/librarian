import { Injectable, Inject } from '@nestjs/common';
import type { IAuthorRepository } from '../ports/author.repository.interface';

@Injectable()
export class GetAllAuthorsUseCase {
  constructor(
    @Inject('IAuthorRepository')
    private readonly authorRepository: IAuthorRepository,
  ) {}

  async execute() {
    return this.authorRepository.findAll();
  }
}