import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ServiceIntelligenceService } from './service-intelligence.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Service Intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('service-intelligence')
export class ServiceIntelligenceController {
  constructor(private readonly service: ServiceIntelligenceService) {}

  @Get('analyze')
  @ApiOperation({ summary: 'Map detected problems to service recommendations' })
  @ApiQuery({ name: 'problems', description: 'Comma-separated list of detected problems' })
  analyze(@Query('problems') problems: string, @CurrentUser() user: JwtPayload) {
    const list = problems.split(',').map((p) => p.trim()).filter(Boolean);
    return this.service.analyze(user.tenantId, list);
  }
}
