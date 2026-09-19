import { ConversionJob } from '../../domain/conversion-job.entity';

export interface ConversionJobRepositoryInterface {
  save(job: ConversionJob): Promise<void>;
  findById(id: string): Promise<ConversionJob | null>;
}