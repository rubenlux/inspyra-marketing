import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ServiceIntelligenceService } from '../service-intelligence/service-intelligence.service';
import { PricingService } from '../pricing/pricing.service';
import { CreateValidationDto } from './dto/create-validation.dto';
import { ReviewValidationDto } from './dto/review-validation.dto';

const PRIORITY_WEIGHT: Record<string, number> = { CRITICA: 4, ALTA: 3, MEDIA: 2, BAJA: 1 };

function calcOpportunityScore(
  problems: string[],
  analysis: { prioridad: string }[],
  estimatedTicket: number,
  serviceFit: number,
): number {
  const problemScore = problems.length >= 5 ? 25 : problems.length >= 3 ? 15 : 10;
  const maxPriority = Math.max(...analysis.map((r) => PRIORITY_WEIGHT[r.prioridad] ?? 0), 0);
  const priorityScore = Math.round((maxPriority / 4) * 25);
  const fitScore = serviceFit > 0.75 ? 25 : serviceFit > 0.5 ? 15 : serviceFit > 0.25 ? 8 : 0;
  const ticketScore = estimatedTicket > 3000 ? 25 : estimatedTicket > 2000 ? 20 : estimatedTicket > 1000 ? 12 : estimatedTicket > 500 ? 5 : 0;
  return Math.min(problemScore + priorityScore + fitScore + ticketScore, 100);
}

@Injectable()
export class ProspectValidationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly intel: ServiceIntelligenceService,
    private readonly pricing: PricingService,
  ) {}

  async create(tenantId: string, dto: CreateValidationDto) {
    const prospect = await this.prisma.prospect.findFirst({
      where: { id: dto.prospectId, tenantId, deletedAt: null },
    });
    if (!prospect) throw new NotFoundException('Prospect not found');

    const existing = await this.prisma.prospectValidation.findUnique({
      where: { prospectId: dto.prospectId },
    });
    if (existing) throw new ConflictException('Validation already exists for this prospect');

    return this.prisma.prospectValidation.create({
      data: {
        tenantId,
        prospectId: dto.prospectId,
        agentScore: dto.agentScore,
        servicesRecommended: dto.servicesRecommended,
        estimatedTicketUsd: dto.estimatedTicketUsd,
        prioridad: dto.prioridad,
        reasoning: dto.reasoning,
        decisionFactors: dto.decisionFactors ?? undefined,
      },
    });
  }

  async findAll(tenantId: string, status?: string) {
    return this.prisma.prospectValidation.findMany({
      where: { tenantId, ...(status ? { status: status as never } : {}) },
      include: {
        prospect: {
          select: {
            id: true, nombreEmpresa: true, ciudad: true, pais: true,
            problemasEncontrados: true, score: true, estado: true,
          },
        },
        validator: { select: { id: true, firstName: true, lastName: true } },
        feedback: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const v = await this.prisma.prospectValidation.findFirst({
      where: { id, tenantId },
      include: {
        prospect: { select: { id: true, nombreEmpresa: true, problemasEncontrados: true, score: true } },
        validator: { select: { id: true, firstName: true, lastName: true } },
        feedback: true,
      },
    });
    if (!v) throw new NotFoundException('Validation not found');
    return v;
  }

  async review(id: string, tenantId: string, reviewerId: string, dto: ReviewValidationDto) {
    if (dto.status === 'REJECTED' && !dto.rejectionReason) {
      throw new BadRequestException('rejectionReason is required when status is REJECTED');
    }

    const v = await this.findOne(id, tenantId);

    // Sync score back to prospect when human validates
    if (dto.status === 'VALIDATED') {
      await this.prisma.prospect.update({
        where: { id: v.prospectId },
        data: { score: dto.humanScore },
      });
    }

    const updated = await this.prisma.prospectValidation.update({
      where: { id },
      data: {
        humanScore: dto.humanScore,
        status: dto.status,
        notes: dto.notes,
        validatedBy: reviewerId,
        validatedAt: new Date(),
      },
    });

    // Create feedback record to capture rejection reason (learning signal)
    if (dto.rejectionReason) {
      await this.prisma.validationFeedback.upsert({
        where: { validationId: id },
        create: {
          tenantId,
          validationId: id,
          rejectionReason: dto.rejectionReason,
          notes: dto.feedbackNotes,
          createdBy: reviewerId,
        },
        update: {
          rejectionReason: dto.rejectionReason,
          notes: dto.feedbackNotes,
        },
      });
    }

    return updated;
  }

  async getScoreDrift(tenantId: string) {
    const validated = await this.prisma.prospectValidation.findMany({
      where: { tenantId, status: 'VALIDATED', humanScore: { not: null } },
      select: { agentScore: true, humanScore: true, prioridad: true },
    });

    if (validated.length === 0) return { count: 0, avgDrift: 0, overestimated: 0, underestimated: 0 };

    const drifts = validated.map((v) => v.agentScore - (v.humanScore ?? 0));
    const avgDrift = drifts.reduce((a, b) => a + b, 0) / drifts.length;
    const overestimated = drifts.filter((d) => d > 10).length;
    const underestimated = drifts.filter((d) => d < -10).length;

    return {
      count: validated.length,
      avgDrift: Math.round(avgDrift * 10) / 10,
      overestimated,
      underestimated,
      accurateCount: validated.length - overestimated - underestimated,
    };
  }

  async getKpis(tenantId: string) {
    const all = await this.prisma.prospectValidation.findMany({
      where: { tenantId },
      include: { feedback: true },
    });

    const validated = all.filter((v) => v.status === 'VALIDATED' && v.humanScore !== null);
    const rejected = all.filter((v) => v.status === 'REJECTED');
    const pending = all.filter((v) => v.status === 'PENDING');

    // Score stats
    const avgAgentScore = all.length ? all.reduce((s, v) => s + v.agentScore, 0) / all.length : 0;
    const avgHumanScore = validated.length
      ? validated.reduce((s, v) => s + (v.humanScore ?? 0), 0) / validated.length
      : 0;

    // Drift (only for validated records)
    const drifts = validated.map((v) => v.agentScore - (v.humanScore ?? 0));
    const avgDrift = drifts.length ? drifts.reduce((a, b) => a + b, 0) / drifts.length : 0;

    const sorted = [...drifts].sort((a, b) => a - b);
    const medianDrift = sorted.length
      ? sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)]
      : 0;

    // Agent accuracy bands
    const agentAccuracy = {
      accurate: drifts.filter((d) => Math.abs(d) <= 10).length,
      overestimated: drifts.filter((d) => d > 10).length,
      underestimated: drifts.filter((d) => d < -10).length,
    };

    // Top recommended service
    const serviceCounts: Record<string, number> = {};
    for (const v of all) {
      for (const svc of v.servicesRecommended) {
        serviceCounts[svc] = (serviceCounts[svc] ?? 0) + 1;
      }
    }
    const topRecommendedService =
      Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    // Top rejection reason (from ValidationFeedback)
    const reasonCounts: Record<string, number> = {};
    for (const v of all) {
      if (v.feedback) {
        const r = v.feedback.rejectionReason;
        reasonCounts[r] = (reasonCounts[r] ?? 0) + 1;
      }
    }
    const topRejectionReason =
      Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    // Estimated ticket range
    const ticketValues = all
      .map((v) => Number(v.estimatedTicketUsd ?? 0))
      .filter((t) => t > 0);
    const avgEstimatedTicket = ticketValues.length
      ? ticketValues.reduce((a, b) => a + b, 0) / ticketValues.length
      : 0;

    return {
      total: all.length,
      pending: pending.length,
      validated: validated.length,
      rejected: rejected.length,
      approvalRate: all.length > 0 ? Math.round((validated.length / all.length) * 1000) / 10 : 0,
      avgAgentScore: Math.round(avgAgentScore * 10) / 10,
      avgHumanScore: Math.round(avgHumanScore * 10) / 10,
      avgDrift: Math.round(avgDrift * 10) / 10,
      medianDrift: Math.round(medianDrift * 10) / 10,
      agentAccuracy,
      avgEstimatedTicketUsd: Math.round(avgEstimatedTicket),
      topRecommendedService,
      topRejectionReason,
    };
  }

  async runAgent(prospectId: string, tenantId: string) {
    const prospect = await this.prisma.prospect.findFirst({
      where: { id: prospectId, tenantId, deletedAt: null },
    });
    if (!prospect) throw new NotFoundException(`Prospect ${prospectId} not found`);
    if (prospect.estado !== 'INVESTIGADO') {
      throw new BadRequestException(
        `Prospect must be in INVESTIGADO state to run Opportunity Agent (current: ${prospect.estado})`,
      );
    }

    const existing = await this.prisma.prospectValidation.findUnique({ where: { prospectId } });
    if (existing) throw new ConflictException('Opportunity Agent already ran for this prospect');

    const problems: string[] = prospect.problemasEncontrados ?? [];
    if (problems.length === 0) {
      throw new BadRequestException('No problems detected — Research Agent must run first');
    }

    // Step 1: Service Intelligence — map problems to services
    const analysis = await this.intel.analyze(tenantId, problems);

    // Step 2: Find catalog items by recommended service names
    const recommendedNames = [...new Set(analysis.flatMap((r) => r.serviciosRecomendados))];
    const catalogItems = await this.prisma.serviceCatalogItem.findMany({
      where: { tenantId, activo: true, nombre: { in: recommendedNames } },
      select: { id: true, nombre: true },
    });

    // Step 3: Pricing
    let estimatedTicketUsd = 0;
    if (catalogItems.length > 0) {
      const pricingResult = await this.pricing.calculate(tenantId, {
        items: catalogItems.map((i) => ({ catalogItemId: i.id, cantidad: 1 })),
      }) as unknown as Record<string, number>;
      estimatedTicketUsd = pricingResult['total'] ?? 0;
    }

    // Step 4: Score
    const serviceFit = recommendedNames.length > 0 ? catalogItems.length / recommendedNames.length : 0;
    const agentScore = calcOpportunityScore(problems, analysis, estimatedTicketUsd, serviceFit);

    const topPrioridad = analysis.reduce((best, r) => {
      return (PRIORITY_WEIGHT[r.prioridad] ?? 0) > (PRIORITY_WEIGHT[best] ?? 0) ? r.prioridad : best;
    }, 'BAJA');

    const prioridadMap: Record<string, 'BAJA' | 'MEDIA' | 'ALTA'> = {
      BAJA: 'BAJA', MEDIA: 'MEDIA', ALTA: 'ALTA', CRITICA: 'ALTA',
    };

    return this.create(tenantId, {
      prospectId,
      agentScore,
      servicesRecommended: recommendedNames,
      estimatedTicketUsd,
      prioridad: prioridadMap[topPrioridad] ?? 'MEDIA',
      reasoning: `Evaluador: ${problems.length} problemas detectados, score ${agentScore}/100.`,
      decisionFactors: {
        problemScore: problems.length >= 5 ? 25 : problems.length >= 3 ? 15 : 10,
        priorityScore: Math.round(
          (Math.max(...analysis.map((r) => PRIORITY_WEIGHT[r.prioridad] ?? 0), 0) / 4) * 25,
        ),
        fitScore: serviceFit > 0.75 ? 25 : serviceFit > 0.5 ? 15 : serviceFit > 0.25 ? 8 : 0,
        ticketScore: estimatedTicketUsd > 3000 ? 25 : estimatedTicketUsd > 2000 ? 20 : estimatedTicketUsd > 1000 ? 12 : estimatedTicketUsd > 500 ? 5 : 0,
      },
    });
  }

  async recalculate(prospectId: string, tenantId: string) {
    const existing = await this.prisma.prospectValidation.findFirst({
      where: { prospectId, tenantId },
    });
    if (!existing) throw new NotFoundException('No validation found — run the scoring agent first');

    const prospect = await this.prisma.prospect.findFirst({
      where: { id: prospectId, tenantId, deletedAt: null },
    });
    if (!prospect) throw new NotFoundException(`Prospect ${prospectId} not found`);

    const problems: string[] = prospect.problemasEncontrados ?? [];
    if (problems.length === 0) throw new BadRequestException('No problems to score');

    const analysis = await this.intel.analyze(tenantId, problems);
    const recommendedNames = [...new Set(analysis.flatMap((r) => r.serviciosRecomendados))];
    const catalogItems = await this.prisma.serviceCatalogItem.findMany({
      where: { tenantId, activo: true, nombre: { in: recommendedNames } },
      select: { id: true, nombre: true },
    });

    let estimatedTicketUsd = 0;
    if (catalogItems.length > 0) {
      const pricingResult = await this.pricing.calculate(tenantId, {
        items: catalogItems.map((i) => ({ catalogItemId: i.id, cantidad: 1 })),
      }) as unknown as Record<string, number>;
      estimatedTicketUsd = pricingResult['total'] ?? 0;
    }

    const serviceFit = recommendedNames.length > 0 ? catalogItems.length / recommendedNames.length : 0;
    const agentScore = calcOpportunityScore(problems, analysis, estimatedTicketUsd, serviceFit);
    const topPrioridad = analysis.reduce((best, r) =>
      (PRIORITY_WEIGHT[r.prioridad] ?? 0) > (PRIORITY_WEIGHT[best] ?? 0) ? r.prioridad : best, 'BAJA');
    const prioridadMap: Record<string, 'BAJA' | 'MEDIA' | 'ALTA'> = { BAJA: 'BAJA', MEDIA: 'MEDIA', ALTA: 'ALTA', CRITICA: 'ALTA' };

    // Bump version: v1 → v2 → v3 ...
    const match = existing.validationVersion?.match(/^v(\d+)$/);
    const nextVersion = match ? `v${parseInt(match[1]) + 1}` : 'v2';

    return this.prisma.prospectValidation.update({
      where: { id: existing.id },
      data: {
        agentScore,
        servicesRecommended: recommendedNames,
        estimatedTicketUsd,
        prioridad: prioridadMap[topPrioridad] ?? 'MEDIA',
        reasoning: `Evaluador ${nextVersion}: ${problems.length} problemas detectados, score ${agentScore}/100.`,
        decisionFactors: {
          problemScore: problems.length >= 5 ? 25 : problems.length >= 3 ? 15 : 10,
          priorityScore: Math.round(
            (Math.max(...analysis.map((r) => PRIORITY_WEIGHT[r.prioridad] ?? 0), 0) / 4) * 25,
          ),
          fitScore: serviceFit > 0.75 ? 25 : serviceFit > 0.5 ? 15 : serviceFit > 0.25 ? 8 : 0,
          ticketScore: estimatedTicketUsd > 3000 ? 25 : estimatedTicketUsd > 2000 ? 20 : estimatedTicketUsd > 1000 ? 12 : estimatedTicketUsd > 500 ? 5 : 0,
        },
        validationVersion: nextVersion,
        // Reset human review so the new score gets fresh human validation
        status: 'PENDING',
        humanScore: null,
        validatedBy: null,
        validatedAt: null,
      },
    });
  }
}
