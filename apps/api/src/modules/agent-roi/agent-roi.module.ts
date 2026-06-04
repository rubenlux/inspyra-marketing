import { Module } from '@nestjs/common';
import { AgentRoiService } from './agent-roi.service';
import { AgentRoiController } from './agent-roi.controller';

@Module({
  controllers: [AgentRoiController],
  providers: [AgentRoiService],
  exports: [AgentRoiService],
})
export class AgentRoiModule {}
