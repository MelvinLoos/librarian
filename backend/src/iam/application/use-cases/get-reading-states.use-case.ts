import { Injectable, Inject } from '@nestjs/common';
import type { IReadingProgressRepository } from '../ports/reading-progress.repository.interface';

@Injectable()
export class GetReadingStatesUseCase {
  constructor(
    @Inject('IReadingProgressRepository')
    private readonly progressRepository: IReadingProgressRepository,
  ) {}

  async execute(userId: string) {
    return this.progressRepository.getUserReadingStates(userId);
  }
}