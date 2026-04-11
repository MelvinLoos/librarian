import { Module } from '@nestjs/common';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  // Import SharedModule to ensure PrismaService is available for injection
  imports: [SharedModule], 
  controllers: [AssetController],
  providers: [AssetService],
})
export class AssetModule {}