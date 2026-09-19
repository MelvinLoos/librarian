import { Test, TestingModule } from '@nestjs/testing';
import { GetCustomColumnsUseCase } from './get-custom-columns.use-case';
import { CustomColumn } from '../../domain/entities/custom-column.entity';
import type { CustomColumnRepositoryInterface } from '../ports/custom-column.repository.interface';

describe('GetCustomColumnsUseCase', () => {
  let useCase: GetCustomColumnsUseCase;
  let customColumnRepository: jest.Mocked<CustomColumnRepositoryInterface>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCustomColumnsUseCase,
        {
          provide: 'ICustomColumnRepository',
          useValue: { findAll: jest.fn(), upsert: jest.fn(), deleteById: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get(GetCustomColumnsUseCase);
    customColumnRepository = module.get(
      'ICustomColumnRepository',
    ) as jest.Mocked<CustomColumnRepositoryInterface>;
  });

  it('should return all custom columns', async () => {
    customColumnRepository.findAll.mockResolvedValue([
      new CustomColumn({ name: '#read_status', value: '', dataType: 'text' }),
    ]);

    const columns = await useCase.execute();

    expect(customColumnRepository.findAll).toHaveBeenCalledTimes(1);
    expect(columns).toHaveLength(1);
    expect(columns[0].props.name).toBe('#read_status');
  });
});