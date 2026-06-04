import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export type RoiField =
  | 'prospectsCreated'
  | 'prospectsValidated'
  | 'meetingsGenerated'
  | 'dealsCreated';

@Injectable()
export class AgentRoiService {
  constructor(private readonly prisma: PrismaService) {}

  // Atomically increment one counter for the current month.
  // Called from other services whenever an agent produces a measurable outcome.
  async increment(tenantId: string, agentName: string, field: RoiField, period?: string) {
    const p = period ?? new Date().toISOString().slice(0, 7); // "2026-06"

    await this.prisma.agentRoi.upsert({
      where: { tenantId_agentName_period: { tenantId, agentName, period: p } },
      create: { tenantId, agentName, period: p, [field]: 1 },
      update: { [field]: { increment: 1 } },
    });
  }

  async addRevenue(tenantId: string, agentName: string, amountUsd: number, period?: string) {
    const p = period ?? new Date().toISOString().slice(0, 7);
    await this.prisma.agentRoi.upsert({
      where: { tenantId_agentName_period: { tenantId, agentName, period: p } },
      create: { tenantId, agentName, period: p, revenueGeneratedUsd: amountUsd },
      update: { revenueGeneratedUsd: { increment: amountUsd } },
    });
  }

  async getDashboard(tenantId: string, period?: string) {
    const p = period ?? new Date().toISOString().slice(0, 7);
    const rows = await this.prisma.agentRoi.findMany({
      where: { tenantId, period: p },
      orderBy: { agentName: 'asc' },
    });

    const totals = rows.reduce(
      (acc, r) => ({
        prospectsCreated: acc.prospectsCreated + r.prospectsCreated,
        prospectsValidated: acc.prospectsValidated + r.prospectsValidated,
        meetingsGenerated: acc.meetingsGenerated + r.meetingsGenerated,
        dealsCreated: acc.dealsCreated + r.dealsCreated,
        revenueGeneratedUsd: Number(acc.revenueGeneratedUsd) + Number(r.revenueGeneratedUsd),
        costTokensUsd: Number(acc.costTokensUsd) + Number(r.costTokensUsd),
      }),
      { prospectsCreated: 0, prospectsValidated: 0, meetingsGenerated: 0, dealsCreated: 0, revenueGeneratedUsd: 0, costTokensUsd: 0 },
    );

    return { period: p, agents: rows, totals };
  }
}
