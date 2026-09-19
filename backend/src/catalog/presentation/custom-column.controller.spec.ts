import { Test, TestingModule } from '@nestjs/testing';
import { CustomColumnController } from './custom-column.controller';
import { GetCustomColumnsUseCase } from '../application/use-cases/get-custom-columns.use-case';
import { UpsertCustomColumnUseCase } from '../application/use-cases/upsert-custom-column.use-case';
import { DeleteCustomColumnUseCase } from '../application/use-cases/delete-custom-column.use-case';
import { CustomColumn } from '../domain/entities/custom-column.entity';

describe('CustomColumnController', () => {
  let controller: CustomColumnController;
  let getCustomColumnsUseCase: jest.Mocked<GetCustomColumnsUseCase>;
  let upsertCustomColumnUseCase: jest.Mocked<UpsertCustomColumnUseCase>;
  let deleteCustomColumnUseCase: jest.Mocked<DeleteCustomColumnUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomColumnController],
      providers: [
        {
          provide: GetCustomColumnsUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UpsertCustomColumnUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: DeleteCustomColumnUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<CustomColumnController>(CustomColumnController);
    getCustomColumnsUseCase = module.get(GetCustomColumnsUseCase);
    upsertCustomColumnUseCase = module.get(UpsertCustomColumnUseCase);
    deleteCustomColumnUseCase = module.get(DeleteCustomColumnUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listColumns', () => {
    it('should return all custom columns', async () => {
      getCustomColumnsUseCase.execute.mockResolvedValue([
        new CustomColumn({ name: '#read_status', value: '', dataType: 'text' }),
      ]);

      const columns = await controller.listColumns();

      expect(getCustomColumnsUseCase.execute).toHaveBeenCalledTimes(1);
      expect(columns).toHaveLength(1);
      expect(columns[0].props.name).toBe('#read_status');
    });
  });

  describe('upsertColumn', () => {
    it('should create/update a custom column', async () => {
      const created = new CustomColumn({
        name: '#genre',
        value: '',
        dataType: 'series',
        displayLabel: 'Genre',
        isMultiple: true,
      });
      upsertCustomColumnUseCase.execute.mockResolvedValue(created);

      const result = await controller.upsertColumn({
        name: '#genre',
        dataType: 'series',
        displayLabel: 'Genre',
        isMultiple: true,
      });

      expect(upsertCustomColumnUseCase.execute).toHaveBeenCalledWith({
        name: '#genre',
        dataType: 'series',
        displayLabel: 'Genre',
        isMultiple: true,
      });
      expect(result.props.displayLabel).toBe('Genre');
    });
  });

  describe('deleteColumn', () => {
    it('should delete a custom column', async () => {
      deleteCustomColumnUseCase.execute.mockResolvedValue(true);

      const result = await controller.deleteColumn('col-1');

      expect(deleteCustomColumnUseCase.execute).toHaveBeenCalledWith({
        id: 'col-1',
      });
      expect(result.deleted).toBe(true);
    });
  });
});