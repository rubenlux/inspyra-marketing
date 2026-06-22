import { Body, Controller, Get, Param, Post, Request, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ResearchService } from './research.service';
import { CreateResearchJobDto } from './dto/create-research-job.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { PlaywrightAuditService } from '../enrichment/playwright-audit.service';
import { OpportunityEngineService } from '../enrichment/opportunity-engine.service';

interface AuthRequest {
  user: { id: string; tenantId: string };
}

@Controller('research')
export class ResearchController {
  constructor(
    private readonly researchService: ResearchService,
    private readonly playwrightAudit: PlaywrightAuditService,
    private readonly opportunityEngine: OpportunityEngineService,
  ) {}

  @Post('jobs')
  @UseGuards(JwtAuthGuard)
  createJob(@Body() dto: CreateResearchJobDto, @Request() req: AuthRequest) {
    return this.researchService.createJob(dto, req.user.tenantId, req.user.id);
  }

  @Get('jobs')
  @UseGuards(JwtAuthGuard)
  listJobs(@Request() req: AuthRequest) {
    return this.researchService.listJobs(req.user.tenantId);
  }

  @Get('jobs/:id')
  @UseGuards(JwtAuthGuard)
  getJob(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.researchService.getJob(id, req.user.tenantId);
  }

  @Get('jobs/:id/candidates')
  @UseGuards(JwtAuthGuard)
  getCandidates(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.researchService.getCandidates(id, req.user.tenantId);
  }

  @Post('candidates/:id/analyze')
  @UseGuards(JwtAuthGuard)
  analyzeCandidate(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.researchService.analyzeCandidate(id, req.user.tenantId);
  }

  @Post('website-audit')
  @UseGuards(JwtAuthGuard)
  websiteAudit(
    @Body() body: { url: string },
    @CurrentUser() _user: JwtPayload,
  ) {
    return this.researchService.websiteAudit(body.url);
  }

  @Post('business-opportunity')
  @UseGuards(JwtAuthGuard)
  analyzeBusinessOpportunity(
    @Body() body: {
      empresa: string;
      rubro: string;
      website: string;
      googleMapsData?: Record<string, any>;
      websiteAudit?: Record<string, any>;
      contactData?: Record<string, any>;
    },
    @CurrentUser() _user: JwtPayload,
  ) {
    return this.researchService.analyzeBusinessOpportunity(
      body.empresa,
      body.rubro,
      body.website,
      body.googleMapsData,
      body.websiteAudit,
      body.contactData,
    );
  }

  @Post('opportunity-test')
  async opportunityTest(@Body() body: { url: string }) {
    try {
      // Step 1: Ejecutar Playwright
      const signals = await this.playwrightAudit.auditWebsite(body.url);

      // Step 2: Ejecutar Opportunity Engine
      const industry = signals.noWebsite ? 'Unknown' : 'Mixed';
      const opportunities = this.opportunityEngine.detect(signals, industry);

      return {
        url: body.url,
        timestamp: new Date().toISOString(),
        signals,
        opportunities,
        summary: {
          totalSignals: Object.keys(signals).length,
          totalOpportunities: opportunities.length,
          activatedOpportunities: opportunities.filter(o => o.activated).length,
        }
      };
    } catch (error) {
      throw new HttpException(
        `Error in opportunity engine test: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
