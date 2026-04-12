import { Injectable, Inject } from '@nestjs/common';
import type { ISeriesRepository } from '../ports/series.repository.interface';

@Injectable()
export class GetAllSeriesUseCase {
  constructor(
    @Inject('ISeriesRepository')
    private readonly seriesRepository: ISeriesRepository,
  ) {}

  async execute() {
    return this.seriesRepository.findAll();
  }
}