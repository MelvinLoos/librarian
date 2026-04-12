import { Injectable, Inject } from '@nestjs/common';
import type { ITagRepository } from '../ports/tag.repository.interface';

@Injectable()
export class GetTopTagsUseCase {
  constructor(
    @Inject('ITagRepository')
    private readonly tagRepository: ITagRepository,
  ) {}

  async execute(): Promise<{ id: number; name: string; count: number }[]> {
    return this.tagRepository.getTopTags(15);
  }
}