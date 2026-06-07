import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProposalsService } from './proposals.service';

interface AuthRequest {
  user: { id: string; tenantId: string };
}

@Controller('proposals')
@UseGuards(JwtAuthGuard)
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Post('generate/:prospectId')
  generate(
    @Param('prospectId') prospectId: string,
    @Body() body: { proposalType?: 'OUTREACH' | 'COMMERCIAL' },
    @Request() req: AuthRequest,
  ) {
    return this.proposalsService.generate(
      prospectId,
      req.user.tenantId,
      req.user.id,
      body?.proposalType ?? 'OUTREACH',
    );
  }

  @Get('prospect/:prospectId')
  findByProspect(@Param('prospectId') prospectId: string, @Request() req: AuthRequest) {
    return this.proposalsService.findByProspect(prospectId, req.user.tenantId);
  }

  @Get('prospect/:prospectId/latest')
  findLatest(@Param('prospectId') prospectId: string, @Request() req: AuthRequest) {
    return this.proposalsService.findLatest(prospectId, req.user.tenantId);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.proposalsService.approve(id, req.user.tenantId, req.user.id);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() body: { rejectionReason: string },
    @Request() req: AuthRequest,
  ) {
    return this.proposalsService.reject(id, req.user.tenantId, body.rejectionReason);
  }

  @Post(':id/regenerate')
  regenerate(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.proposalsService.regenerate(id, req.user.tenantId, req.user.id);
  }

  @Post('translate')
  async translate(
    @Body() body: { text: string; sourceLang: string },
    @Request() _req: AuthRequest,
  ) {
    const translation = await this.proposalsService.translate(body.text ?? '', body.sourceLang ?? 'EN');
    return { translation };
  }
}
