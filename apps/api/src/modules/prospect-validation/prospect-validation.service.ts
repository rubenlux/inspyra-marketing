import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ServiceIntelligenceService } from '../service-intelligence/service-intelligence.service';
import { PricingService } from '../pricing/pricing.service';
import { CreateValidationDto } from './dto/create-validation.dto';
import { ReviewValidationDto } from './dto/review-validation.dto';
import {
  buildProspectContext,
  SIR_CATALOG,
  INSPYRA_SERVICE_IDS,
  findAllServiceMatches,
  findBestServiceMatch,
  calcContactability,
  MATCH_TYPE_SCORE,
  IMPACT_SCORE,
  type ServiceMatchResult,
} from '../service-intelligence/catalog';

// ERP-052 — Service Match First
// Score = Service Match Fit (40) + Business Impact (40) + Contactability (20)
// No ticket, no problem count, no SIR opportunityScore.
function calcServiceMatchScore(
  bestMatch: ServiceMatchResult,
  ctx: { hasWebsite: boolean; hasInstagram: boolean; hasLinkedIn: boolean },
): number {
  const matchFitScore = MATCH_TYPE_SCORE[bestMatch.matchType];
  const impactScore   = IMPACT_SCORE[bestMatch.businessImpact];
  const contactScore  = calcContactability({ ...ctx, hasContactPoint: true });
  return Math.min(matchFitScore + impactScore + contactScore, 100);
}

const IMPACT_TO_PRIORIDAD: Record<string, 'BAJA' | 'MEDIA' | 'ALTA'> = {
  CRITICAL: 'ALTA',
  HIGH:     'ALTA',
  MEDIUM:   'MEDIA',
  LOW:      'BAJA',
};

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
        decisionFactors: (dto.decisionFactors as never) ?? undefined,
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

    if ((prospect as unknown as { isLegacy: boolean }).isLegacy) {
      throw new BadRequestException('Cannot run Opportunity Agent on legacy prospects (isLegacy = true)');
    }

    const ELIGIBLE_FOR_OPP = ['NUEVO', 'INVESTIGADO'];
    if (!ELIGIBLE_FOR_OPP.includes(prospect.estado)) {
      throw new BadRequestException(
        `Prospect must be in NUEVO or INVESTIGADO state to run Opportunity Agent (current: ${prospect.estado})`,
      );
    }

    const existing = await this.prisma.prospectValidation.findUnique({ where: { prospectId } });
    if (existing) throw new ConflictException('Opportunity Agent already ran for this prospect');

    // Use currentProblems (post-enrichment, verified) when available; fall back to discovery snapshot
    const problems: string[] = (
      (prospect as unknown as { currentProblems?: string[] }).currentProblems?.length ?? 0) > 0
      ? (prospect as unknown as { currentProblems: string[] }).currentProblems
      : (prospect.problemasEncontrados ?? []);

    const ctx = buildProspectContext(prospect);

    // ── ERP-052: Service Match First ──────────────────────────────────────────

    // Gate 1: Data Sufficiency — ¿Tengo información para evaluar?
    // NO es suficiente con "sin problemas detectados". Necesito presencia digital real.
    const hasContactData = Boolean(
      prospect.email || prospect.telefono || prospect.whatsapp ||
      prospect.instagram || prospect.facebook || prospect.linkedin ||
      prospect.website
    );

    if (!hasContactData) {
      return this.createDiscardedValidation(tenantId, prospectId, 'INSUFFICIENT_DATA', problems);
    }

    // Gate 2: buscar match entre problemas verificados y servicios INSPYRA
    // Si no encontré problemas específicos, eso NO es un descarte
    // es simplemente una oportunidad baja/media sin brechas obvias
    if (problems.length === 0) {
      return this.createLowOpportunityValidation(tenantId, prospectId, problems);
    }

    // Gate 3: buscar match entre problemas verificados y servicios INSPYRA
    const allMatches = findAllServiceMatches(problems, INSPYRA_SERVICE_IDS);

    if (allMatches.length === 0) {
      return this.createDiscardedValidation(tenantId, prospectId, 'NO_SERVICE_MATCH', problems);
    }

    // ── Scoring ───────────────────────────────────────────────────────────────

    const bestMatch  = findBestServiceMatch(allMatches);
    const agentScore = calcServiceMatchScore(bestMatch, ctx);

    const matchFitScore = MATCH_TYPE_SCORE[bestMatch.matchType];
    const impactScore   = IMPACT_SCORE[bestMatch.businessImpact];
    const contactScore  = calcContactability({ ...ctx, hasContactPoint: true });

    // Ticket estimado desde el catálogo SIR (referencial, no determina el score)
    const matchedServiceIds = [...new Set(allMatches.map(m => m.serviceId))];
    const estimatedTicketUsd = matchedServiceIds.reduce((sum, id) => {
      const svc = SIR_CATALOG.find(s => s.id === id);
      return sum + (svc?.avgTicketUsd[0] ?? 0);
    }, 0);

    // Nombres de servicios recomendados
    const servicesRecommended = matchedServiceIds
      .map(id => SIR_CATALOG.find(s => s.id === id)?.name)
      .filter(Boolean) as string[];

    // Reasoning — formato VERIFICACIÓN → SERVICE MATCH → OPORTUNIDAD
    const verificationBlock = [
      `Sitio web: ${ctx.hasWebsite ? 'SÍ' : 'NO'}`,
      `Instagram: ${ctx.hasInstagram ? 'SÍ' : 'NO'}`,
      `LinkedIn: ${ctx.hasLinkedIn ? 'SÍ' : 'NO'}`,
    ].join(' · ');

    const matchBlock = allMatches.slice(0, 3)
      .map(m => {
        const svcName = SIR_CATALOG.find(s => s.id === m.serviceId)?.name ?? m.serviceId;
        return `"${m.problema}" → ${svcName} [${m.matchType} / ${m.businessImpact}]`;
      })
      .join('; ');

    const reasoning = [
      `VERIFICACIÓN: ${verificationBlock}.`,
      `PROBLEMAS: ${problems.length} detectados, ${allMatches.length} con match INSPYRA.`,
      `SERVICE MATCH: ${matchBlock}.`,
      `SCORE: ${agentScore}/100 (Fit: ${matchFitScore} · Impact: ${impactScore} · Contactabilidad: ${contactScore}).`,
    ].join(' ');

    return this.create(tenantId, {
      prospectId,
      agentScore,
      servicesRecommended,
      estimatedTicketUsd,
      prioridad: IMPACT_TO_PRIORIDAD[bestMatch.businessImpact] ?? 'MEDIA',
      reasoning,
      decisionFactors: {
        matchFitScore,
        impactScore,
        contactScore,
        bestMatch: {
          problema:       bestMatch.problema,
          serviceId:      bestMatch.serviceId,
          matchType:      bestMatch.matchType,
          businessImpact: bestMatch.businessImpact,
        },
        allMatches: allMatches.map(m => ({
          problema:       m.problema,
          serviceId:      m.serviceId,
          matchType:      m.matchType,
          businessImpact: m.businessImpact,
        })),
        hasWebsite:    ctx.hasWebsite,
        hasInstagram:  ctx.hasInstagram,
        hasLinkedIn:   ctx.hasLinkedIn,
        sector:        ctx.sector,
        businessModel: ctx.businessModel,
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

    const problems: string[] = (
      (prospect as unknown as { currentProblems?: string[] }).currentProblems?.length ?? 0) > 0
      ? (prospect as unknown as { currentProblems: string[] }).currentProblems
      : (prospect.problemasEncontrados ?? []);

    const ctx = buildProspectContext(prospect);
    const match = existing.validationVersion?.match(/^v(\d+)$/);
    const nextVersion = match ? `v${parseInt(match[1]) + 1}` : 'v2';

    // ── ERP-052: Service Match First ──────────────────────────────────────────

    if (problems.length === 0) {
      return this.prisma.prospectValidation.update({
        where: { id: existing.id },
        data: {
          agentScore: 0, status: 'DISCARDED', discardReason: 'INSUFFICIENT_DATA',
          servicesRecommended: [], estimatedTicketUsd: 0, prioridad: 'BAJA',
          reasoning: `[${nextVersion}] DISCARD: INSUFFICIENT_DATA — sin problemas detectados.`,
          validationVersion: nextVersion, humanScore: null, validatedBy: null, validatedAt: null,
        },
      });
    }

    const allMatches = findAllServiceMatches(problems, INSPYRA_SERVICE_IDS);

    if (allMatches.length === 0) {
      return this.prisma.prospectValidation.update({
        where: { id: existing.id },
        data: {
          agentScore: 0, status: 'DISCARDED', discardReason: 'NO_SERVICE_MATCH',
          servicesRecommended: [], estimatedTicketUsd: 0, prioridad: 'BAJA',
          reasoning: `[${nextVersion}] DISCARD: NO_SERVICE_MATCH — ${problems.length} problema(s) sin match con servicios INSPYRA.`,
          validationVersion: nextVersion, humanScore: null, validatedBy: null, validatedAt: null,
        },
      });
    }

    const bestMatch  = findBestServiceMatch(allMatches);
    const agentScore = calcServiceMatchScore(bestMatch, ctx);

    const matchFitScore = MATCH_TYPE_SCORE[bestMatch.matchType];
    const impactScore   = IMPACT_SCORE[bestMatch.businessImpact];
    const contactScore  = calcContactability({ ...ctx, hasContactPoint: true });

    const matchedServiceIds  = [...new Set(allMatches.map(m => m.serviceId))];
    const estimatedTicketUsd = matchedServiceIds.reduce((sum, id) => {
      const svc = SIR_CATALOG.find(s => s.id === id);
      return sum + (svc?.avgTicketUsd[0] ?? 0);
    }, 0);

    const servicesRecommended = matchedServiceIds
      .map(id => SIR_CATALOG.find(s => s.id === id)?.name)
      .filter(Boolean) as string[];

    const verificationBlock = [
      `Sitio web: ${ctx.hasWebsite ? 'SÍ' : 'NO'}`,
      `Instagram: ${ctx.hasInstagram ? 'SÍ' : 'NO'}`,
      `LinkedIn: ${ctx.hasLinkedIn ? 'SÍ' : 'NO'}`,
    ].join(' · ');

    const matchBlock = allMatches.slice(0, 3)
      .map(m => {
        const svcName = SIR_CATALOG.find(s => s.id === m.serviceId)?.name ?? m.serviceId;
        return `"${m.problema}" → ${svcName} [${m.matchType} / ${m.businessImpact}]`;
      })
      .join('; ');

    const reasoning = [
      `[${nextVersion}] VERIFICACIÓN: ${verificationBlock}.`,
      `PROBLEMAS: ${problems.length} detectados, ${allMatches.length} con match INSPYRA.`,
      `SERVICE MATCH: ${matchBlock}.`,
      `SCORE: ${agentScore}/100 (Fit: ${matchFitScore} · Impact: ${impactScore} · Contactabilidad: ${contactScore}).`,
    ].join(' ');

    return this.prisma.prospectValidation.update({
      where: { id: existing.id },
      data: {
        agentScore,
        servicesRecommended,
        estimatedTicketUsd,
        prioridad: IMPACT_TO_PRIORIDAD[bestMatch.businessImpact] ?? 'MEDIA',
        reasoning,
        status: 'PENDING',
        discardReason: null,
        humanScore: null,
        validatedBy: null,
        validatedAt: null,
        validationVersion: nextVersion,
        decisionFactors: {
          matchFitScore,
          impactScore,
          contactScore,
          bestMatch: {
            problema:       bestMatch.problema,
            serviceId:      bestMatch.serviceId,
            matchType:      bestMatch.matchType,
            businessImpact: bestMatch.businessImpact,
          },
          allMatches: allMatches.map(m => ({
            problema:       m.problema,
            serviceId:      m.serviceId,
            matchType:      m.matchType,
            businessImpact: m.businessImpact,
          })),
          hasWebsite:    ctx.hasWebsite,
          hasInstagram:  ctx.hasInstagram,
          hasLinkedIn:   ctx.hasLinkedIn,
          sector:        ctx.sector,
          businessModel: ctx.businessModel,
        } as never,
      },
    });
  }

  private async createDiscardedValidation(
    tenantId: string,
    prospectId: string,
    discardReason: 'NO_SERVICE_MATCH' | 'ALREADY_SOLVED' | 'LOW_IMPACT' | 'INSUFFICIENT_DATA',
    problemsAnalyzed: string[],
  ) {
    const existing = await this.prisma.prospectValidation.findUnique({ where: { prospectId } });
    if (existing) throw new ConflictException('Validation already exists for this prospect');

    const descReason: Record<string, string> = {
      NO_SERVICE_MATCH:   'ningún problema detectado corresponde a un servicio INSPYRA',
      ALREADY_SOLVED:     'el prospecto ya tiene resuelto lo que INSPYRA ofrece',
      LOW_IMPACT:         'todos los matches son detalles cosméticos sin impacto comercial real',
      INSUFFICIENT_DATA:  'datos insuficientes para evaluar la oportunidad',
    };

    return this.prisma.prospectValidation.create({
      data: {
        tenantId,
        prospectId,
        agentScore:           0,
        status:               'DISCARDED',
        discardReason:        discardReason as never,
        servicesRecommended:  [],
        estimatedTicketUsd:   0,
        prioridad:            'BAJA',
        reasoning: `DISCARD: ${discardReason} — ${descReason[discardReason] ?? ''}. Problemas analizados (${problemsAnalyzed.length}): ${problemsAnalyzed.slice(0, 5).join('; ')}.`,
        decisionFactors: {
          discardReason,
          problemsAnalyzed: problemsAnalyzed.slice(0, 10),
        },
      },
    });
  }

  private async createLowOpportunityValidation(
    tenantId: string,
    prospectId: string,
    problemsAnalyzed: string[],
  ) {
    const existing = await this.prisma.prospectValidation.findUnique({ where: { prospectId } });
    if (existing) throw new ConflictException('Validation already exists for this prospect');

    const prospect = await this.prisma.prospect.findFirst({
      where: { id: prospectId, tenantId, deletedAt: null },
    });
    if (!prospect) throw new NotFoundException(`Prospect ${prospectId} not found`);

    const ctx = buildProspectContext(prospect);

    return this.prisma.prospectValidation.create({
      data: {
        tenantId,
        prospectId,
        agentScore:           35,
        status:               'PENDING',
        servicesRecommended:  [],
        estimatedTicketUsd:   0,
        prioridad:            'BAJA',
        reasoning: `OPORTUNIDAD BAJA — Prospecto verificado con presencia digital completa pero sin brechas obvias detectadas. ` +
          `Empresa está activa en web y redes. Sin problemas específicos en catálogo INSPYRA. ` +
          `Requiere análisis comercial para identificar oportunidades de valor agregado.`,
        decisionFactors: {
          dataVerified: true,
          hasWebsite: ctx.hasWebsite,
          hasInstagram: ctx.hasInstagram,
          hasLinkedIn: ctx.hasLinkedIn,
          problemsDetected: problemsAnalyzed.length,
          opportunityLevel: 'LOW',
          notes: 'Sin brechas evidentes. Requiere revisión humana para identificar oportunidad de venta cruzada o valor agregado.',
        },
      },
    });
  }

  async reactivate(id: string, tenantId: string) {
    const v = await this.prisma.prospectValidation.findFirst({ where: { id, tenantId } });
    if (!v) throw new NotFoundException('Validation not found');
    if (v.status !== 'DISCARDED') {
      throw new BadRequestException('Solo se pueden reactivar validaciones en estado DISCARDED');
    }

    return this.prisma.prospectValidation.update({
      where: { id },
      data: {
        status:       'PENDING',
        discardReason: null,
        reasoning:    `[Reactivado manualmente] ${v.reasoning}`,
      },
    });
  }
}
