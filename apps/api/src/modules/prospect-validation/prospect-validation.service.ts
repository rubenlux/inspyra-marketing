import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateValidationDto } from './dto/create-validation.dto';
import { ReviewValidationDto } from './dto/review-validation.dto';

@Injectable()
export class ProspectValidationService {
  constructor(private readonly prisma: PrismaService) {}

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
}
