import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ResearchService } from './research.service';
import { CreateResearchJobDto } from './dto/create-research-job.dto';

interface AuthRequest {
  user: { id: string; tenantId: string };
}

@Controller('research')
@UseGuards(JwtAuthGuard)
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Post('jobs')
  createJob(@Body() dto: CreateResearchJobDto, @Request() req: AuthRequest) {
    return this.researchService.createJob(dto, req.user.tenantId, req.user.id);
  }

  @Get('jobs')
  listJobs(@Request() req: AuthRequest) {
    return this.researchService.listJobs(req.user.tenantId);
  }

  @Get('jobs/:id')
  getJob(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.researchService.getJob(id, req.user.tenantId);
  }
}
