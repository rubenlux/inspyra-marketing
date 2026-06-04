import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AgentRoiService } from './agent-roi.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Agent ROI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agent-roi')
export class AgentRoiController {
  constructor(private readonly service: AgentRoiService) {}

  @Get()
  @ApiOperation({ summary: 'ROI dashboard per agent for a given month' })
  @ApiQuery({ name: 'period', required: false, description: 'ISO month e.g. 2026-06 (defaults to current month)' })
  getDashboard(@CurrentUser() user: JwtPayload, @Query('period') period?: string) {
    return this.service.getDashboard(user.tenantId, period);
  }
}
