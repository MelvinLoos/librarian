import { UpdateReadingProgressUseCase } from './update-reading-progress.use-case';
import { IReadingProgressRepository } from '../ports/reading-progress.repository.interface';
import { NotFoundException } from '@nestjs/common';

describe('UpdateReadingProgressUseCase', () => {
  let useCase: UpdateReadingProgressUseCase;
  let repository: jest.Mocked<IReadingProgressRepository>;

  beforeEach(() => {
    repository = {
      upsertProgress: jest.fn(),
      getUserReadingStates: jest.fn(),
    } as any;
    useCase = new UpdateReadingProgressUseCase(repository);
  });

  it('should successfully update reading progress', async () => {
    repository.upsertProgress.mockResolvedValue(undefined);

    await expect(useCase.execute('user-123', 42, 'epubcfi(/6/4[chap-2]!/4/2/10/1:0)', 15.5))
      .resolves.not.toThrow();

    expect(repository.upsertProgress).toHaveBeenCalledWith(
      'user-123',
      42,
      'epubcfi(/6/4[chap-2]!/4/2/10/1:0)',
      15.5
    );
  });

  it('should throw NotFoundException when IReadingProgressRepository throws a P2003 error (invalid book ID)', async () => {
    const error: any = new Error('Foreign key constraint failed');
    error.code = 'P2003';
    repository.upsertProgress.mockRejectedValue(error);

    await expect(useCase.execute('user-123', 999, 'loc', 20))
      .rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException when IReadingProgressRepository throws a foreign key message error', async () => {
    const error: any = new Error('foreign key constraint failed on SQLite');
    repository.upsertProgress.mockRejectedValue(error);

    await expect(useCase.execute('user-123', 999, 'loc', 20))
      .rejects.toThrow(NotFoundException);
  });

  it('should propagates other unhandled errors', async () => {
    const error: any = new Error('Database connection timeout');
    error.code = 'P2001';
    repository.upsertProgress.mockRejectedValue(error);

    await expect(useCase.execute('user-123', 42, 'loc', 20))
      .rejects.toThrow('Database connection timeout');
  });
});
