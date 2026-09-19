import { Test, TestingModule } from '@nestjs/testing';
import { DeleteCustomColumnUseCase } from './delete-custom-column.use-case';
import type { CustomColumnRepositoryInterface } from '../ports/custom-column.repository.interface';
import { NotFoundException } from '@nestjs/common';

describe('DeleteCustomColumnUseCase', () => {
  let useCase: DeleteCustomColumnUseCase;
  let customColumnRepository: jest.Mocked<CustomColumnRepositoryInterface>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteCustomColumnUseCase,
        {
          provide: 'ICustomColumnRepository',
          useValue: {
            findAll: jest.fn(),
            upsert: jest.fn(),
            deleteById: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(DeleteCustomColumnUseCase);
    customColumnRepository = module.get('ICustomColumnRepository');
  });

  it('should delete an existing custom column', async () => {
    customColumnRepository.deleteById.mockResolvedValue(true);

    const deleted = await useCase.execute({ id: 'col-1' });

    expect(deleted).toBe(true);
    expect(customColumnRepository.deleteById).toHaveBeenCalledWith('col-1');
  });

  it('should throw NotFoundException when the column does not exist', async () => {
    customColumnRepository.deleteById.mockResolvedValue(false);

    await expect(useCase.execute({ id: 'missing' })).rejects.toThrow(
      NotFoundException,
    );
  });
});
