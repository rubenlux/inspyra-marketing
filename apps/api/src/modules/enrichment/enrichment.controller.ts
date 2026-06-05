import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EnrichmentService } from './enrichment.service';
import { CreateEnrichmentJobDto } from './dto/create-enrichment-job.dto';

interface AuthRequest {
  user: { id: string; tenantId: string };
}

@Controller('enrichment')
@UseGuards(JwtAuthGuard)
export class EnrichmentController {
  constructor(private readonly enrichmentService: EnrichmentService) {}

  @Post('jobs')
  createJob(@Body() dto: CreateEnrichmentJobDto, @Request() req: AuthRequest) {
    return this.enrichmentService.createJob(dto, req.user.tenantId, req.user.id);
  }

  @Get('queue')
  getQueue(@Request() req: AuthRequest) {
    return this.enrichmentService.getQueue(req.user.tenantId);
  }

  @Get('jobs')
  listJobs(@Request() req: AuthRequest, @Query('prospectId') prospectId?: string) {
    return this.enrichmentService.listJobs(req.user.tenantId, prospectId);
  }

  @Get('jobs/:id')
  getJob(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.enrichmentService.getJob(id, req.user.tenantId);
  }

  @Get('prospects/:prospectId/result')
  getResult(@Param('prospectId') prospectId: string, @Request() req: AuthRequest) {
    return this.enrichmentService.getResultByProspect(prospectId, req.user.tenantId);
  }
}
