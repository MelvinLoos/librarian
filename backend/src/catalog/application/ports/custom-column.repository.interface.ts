import { CustomColumn } from '../../domain/entities/custom-column.entity';

export interface CustomColumnRepositoryInterface {
  findAll(): Promise<CustomColumn[]>;
  upsert(column: CustomColumn): Promise<CustomColumn>;
  deleteById(id: string): Promise<boolean>;
}