import { Test, TestingModule } from '@nestjs/testing';
import {
  UpsertCustomColumnUseCase,
  UpsertCustomColumnInput,
} from './upsert-custom-column.use-case';
import { CustomColumn } from '../../domain/entities/custom-column.entity';
import type { CustomColumnRepositoryInterface } from '../ports/custom-column.repository.interface';

describe('UpsertCustomColumnUseCase', () => {
  let useCase: UpsertCustomColumnUseCase;
  let customColumnRepository: jest.Mocked<CustomColumnRepositoryInterface>;

  const input: UpsertCustomColumnInput = {
    name: '#genre',
    dataType: 'series',
    displayLabel: 'Genre',
    isMultiple: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpsertCustomColumnUseCase,
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

    useCase = module.get(UpsertCustomColumnUseCase);
    customColumnRepository = module.get('ICustomColumnRepository');
  });

  it('should persist a custom column definition', async () => {
    const created = new CustomColumn({
      name: input.name,
      value: '',
      dataType: input.dataType,
      displayLabel: input.displayLabel,
      isMultiple: input.isMultiple,
    });
    customColumnRepository.upsert.mockResolvedValue(created);

    const column = await useCase.execute(input);

    expect(customColumnRepository.upsert).toHaveBeenCalledTimes(1);
    expect(column.props.dataType).toBe('series');
    expect(column.props.isMultiple).toBe(true);
  });

  it('should reject an invalid datatype', async () => {
    await expect(
      useCase.execute({ name: '#bad', dataType: 'json' }),
    ).rejects.toThrow();
    expect(customColumnRepository.upsert).not.toHaveBeenCalled();
  });
});
