import { Series } from '../../domain/entities/series.entity';

export interface ISeriesRepository {
  findAll(): Promise<Series[]>;
}