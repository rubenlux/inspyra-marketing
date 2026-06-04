import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AgentTrigger } from '@prisma/client';

interface StartRunDto {
  agentId: string;
  triggeredBy?: AgentTrigger;
  inputSummary?: string;
  inputHash?: string;
}

interface EndRunDto {
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED';
  outputSummary?: string;
  tokens?: {
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    costUsd?: number;
  };
  error?: {
    errorCode: string;
    errorMessage: string;
    toolName?: string;
  };
}

@Injectable()
export class AgentRunsService {
  constructor(private readonly prisma: PrismaService) {}

  async start(tenantId: string, dto: StartRunDto) {
    const run = await this.prisma.agentRun.create({
      data: {
        tenantId,
        agentId: dto.agentId,
        triggeredBy: dto.triggeredBy ?? AgentTrigger.HUMAN,
        inputSummary: dto.inputSummary,
        inputHash: dto.inputHash,
        status: 'RUNNING',
      },
    });
    return { runId: run.id, startedAt: run.startedAt };
  }

  async end(tenantId: string, runId: string, dto: EndRunDto) {
    const run = await this.prisma.agentRun.findFirst({ where: { id: runId, tenantId } });
    if (!run) throw new NotFoundException(`Run ${runId} not found`);

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - run.startedAt.getTime();

    await this.prisma.agentRun.update({
      where: { id: runId },
      data: {
        status: dto.status,
        outputSummary: dto.outputSummary,
        completedAt,
        durationMs,
      },
    });

    if (dto.tokens) {
      const total = dto.tokens.inputTokens + dto.tokens.outputTokens;
      await this.prisma.agentCost.create({
        data: {
          runId,
          provider: dto.tokens.provider,
          model: dto.tokens.model,
          inputTokens: dto.tokens.inputTokens,
          outputTokens: dto.tokens.outputTokens,
          totalTokens: total,
          costUsd: dto.tokens.costUsd ?? 0,
        },
      });
    }

    if (dto.error) {
      await this.prisma.agentError.create({
        data: {
          runId,
          errorCode: dto.error.errorCode,
          errorMessage: dto.error.errorMessage,
          toolName: dto.error.toolName,
        },
      });
    }

    return { runId, status: dto.status, durationMs };
  }

  async getMetrics(tenantId: string, agentId?: string) {
    const where = agentId ? { tenantId, agentId } : { tenantId };

    const [runs, costs] = await Promise.all([
      this.prisma.agentRun.groupBy({
        by: ['agentId', 'status'],
        where,
        _count: true,
      }),
      this.prisma.agentCost.aggregate({
        where: { run: { tenantId } },
        _sum: { totalTokens: true, costUsd: true },
      }),
    ]);

    return { runs, totalCostUsd: costs._sum.costUsd ?? 0, totalTokens: costs._sum.totalTokens ?? 0 };
  }
}
