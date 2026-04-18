import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import type { IReadingProgressRepository } from '../ports/reading-progress.repository.interface';

@Injectable()
export class UpdateReadingProgressUseCase {
  private readonly logger = new Logger(UpdateReadingProgressUseCase.name);

  constructor(
    @Inject('IReadingProgressRepository')
    private readonly progressRepository: IReadingProgressRepository,
  ) {}

  async execute(userId: string, bookId: number, currentPage: number, totalPages: number): Promise<void> {
    this.logger.debug(`Updating reading progress: User ${userId}, Book ${bookId}, Page ${currentPage}/${totalPages}`);
    try {
      await this.progressRepository.upsertProgress(userId, bookId, currentPage, totalPages);
      this.logger.log(`Successfully updated reading progress for User ${userId}, Book ${bookId}`);
    } catch (error: any) {
      this.logger.error(`Failed to update reading progress for User ${userId}, Book ${bookId}`, error.stack);
      // Prisma throws P2003 when foreign key constraint fails
      if (error?.code === 'P2003' || error?.message?.includes('foreign key')) {
        throw new NotFoundException(`Book not found`);
      }
      throw error;
    }
  }
}