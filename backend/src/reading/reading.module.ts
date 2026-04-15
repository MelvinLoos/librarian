import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { IamModule } from '../iam/iam.module';

// Controllers
import { ProgressController } from './presentation/progress.controller';

// Use Cases
import { UpdateReadingProgressUseCase } from './application/use-cases/update-reading-progress.use-case';
import { GetReadingStatesUseCase } from './application/use-cases/get-reading-states.use-case';

// Infrastructure Adapters
import { PrismaReadingProgressRepository } from './infrastructure/prisma-reading-progress.repository';

@Module({
  imports: [
    SharedModule,
    IamModule,
  ],
  controllers: [
    ProgressController,
  ],
  providers: [
    // Application Use Cases
    UpdateReadingProgressUseCase,
    GetReadingStatesUseCase,

    // Infrastructure Adapters bound to their Interface Tokens
    {
      provide: 'IReadingProgressRepository',
      useClass: PrismaReadingProgressRepository,
    },
  ],
  exports: [
    UpdateReadingProgressUseCase,
    GetReadingStatesUseCase,
  ],
})
export class ReadingModule {}
