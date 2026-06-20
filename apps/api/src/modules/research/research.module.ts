import { Module } from '@nestjs/common';
import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ResearchController, CampaignsController],
  providers: [ResearchService, CampaignsService],
  exports: [ResearchService, CampaignsService],
})
export class ResearchModule {}
