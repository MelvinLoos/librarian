import { Injectable, Inject } from '@nestjs/common';
import type { IReadingProgressRepository } from '../ports/reading-progress.repository.interface';

@Injectable()
export class UpdateReadingProgressUseCase {
  constructor(
    @Inject('IReadingProgressRepository')
    private readonly progressRepository: IReadingProgressRepository,
  ) {}

  async execute(userId: string, bookId: number, currentPage: number, totalPages: number): Promise<void> {
    return this.progressRepository.upsertProgress(userId, bookId, currentPage, totalPages);
  }
}