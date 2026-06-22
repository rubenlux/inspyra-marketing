import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateEnrichmentJobDto } from './dto/create-enrichment-job.dto';
import { ClaudeRunnerService } from '../ia-core/services/claude-runner.service';
import { PlaywrightAuditService } from './playwright-audit.service';
import { COMMERCIAL_REASONING_PROMPT, AuditSignals } from '../research/prompts/commercial-reasoning.prompt';

interface Opportunity {
  service: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  evidence: string[];
}

interface OpportunityAnalysis {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedTicket: number;
  confianza: 'ALTA' | 'MEDIA' | 'BAJA';
  summary: string;
  opportunities: Opportunity[];
}

@Injectable()
export class EnrichmentService {
  private readonly logger = new Logger(EnrichmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly claude: ClaudeRunnerService,
    private readonly playwrightAudit: PlaywrightAuditService,
  ) {}

  async createJob(dto: CreateEnrichmentJobDto, tenantId: string, userId: string) {
    const prospect = await this.prisma.prospect.findFirst({
      where: { id: dto.prospectId, tenantId, deletedAt: null },
      include: { validation: true },
    });
    if (!prospect) throw new NotFoundException(`Prospecto ${dto.prospectId} no encontrado`);

    if (!prospect.validation) {
      throw new BadRequestException(`El Evaluador de oportunidad no procesó este prospecto.`);
    }
    if (prospect.validation.status !== 'VALIDATED') {
      throw new BadRequestException(`El análisis de oportunidad no fue aprobado por un humano.`);
    }

    const activeJob = await this.prisma.enrichmentJob.findFirst({
      where: { prospectId: dto.prospectId, tenantId, status: { in: ['PENDING', 'RUNNING'] } },
    });
    if (activeJob) throw new ConflictException(`Ya existe un análisis comercial en curso.`);

    const job = await this.prisma.enrichmentJob.create({
      data: { tenantId, prospectId: dto.prospectId, createdBy: userId, status: 'PENDING' },
    });

    await this.prisma.prospect.updateMany({
      where: { id: dto.prospectId, tenantId, estado: 'NUEVO' },
      data: { estado: 'INVESTIGADO' },
    });

    setImmediate(() =>
      this.runAnalysis(job.id, tenantId, prospect).catch(err =>
        this.logger.error(`[AnalysisJob ${job.id}] Unhandled: ${err.message}`),
      ),
    );

    return job;
  }

  async getJob(jobId: string, tenantId: string) {
    const job = await this.prisma.enrichmentJob.findFirst({
      where: { id: jobId, tenantId },
      include: { result: true },
    });
    if (!job) throw new NotFoundException(`Job ${jobId} no encontrado`);
    return job;
  }

  async listJobs(tenantId: string, prospectId?: string) {
    return this.prisma.enrichmentJob.findMany({
      where: { tenantId, ...(prospectId ? { prospectId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { result: true },
    });
  }

  async getQueue(tenantId: string) {
    const [pending, running, completed, failed] = await Promise.all([
      this.prisma.enrichmentJob.count({ where: { tenantId, status: 'PENDING' } }),
      this.prisma.enrichmentJob.count({ where: { tenantId, status: 'RUNNING' } }),
      this.prisma.enrichmentJob.count({ where: { tenantId, status: 'COMPLETED' } }),
      this.prisma.enrichmentJob.count({ where: { tenantId, status: 'FAILED' } }),
    ]);
    return { pending, running, completed, failed };
  }

  async reviewEnrichment(
    resultId: string,
    tenantId: string,
    reviewedBy: string,
    status: 'APPROVED' | 'REJECTED',
    notes?: string,
  ) {
    const result = await this.prisma.enrichmentResult.findFirst({
      where: { id: resultId, tenantId },
      include: { prospect: { include: { validation: true } } },
    });
    if (!result) throw new NotFoundException(`Resultado ${resultId} no encontrado`);

    const updated = await this.prisma.enrichmentResult.update({
      where: { id: resultId },
      data: { reviewStatus: status, reviewedBy, reviewedAt: new Date(), reviewNotes: notes ?? null },
    });

    if (status === 'APPROVED') {
      const opportunityScore = result.prospect.validation?.agentScore ?? result.prospect.score;
      const commercialScore = Math.floor((opportunityScore + (result.opportunityScore ?? 0)) / 2);
      await this.prisma.prospect.updateMany({
        where: { id: result.prospectId, tenantId, estado: 'ENRIQUECIDO' },
        data: { estado: 'LISTO_PROPUESTA', commercialScore },
      });
    }

    return updated;
  }

  async getResultByProspect(prospectId: string, tenantId: string) {
    const prospect = await this.prisma.prospect.findFirst({ where: { id: prospectId, tenantId } });
    if (!prospect) throw new NotFoundException(`Prospecto ${prospectId} no encontrado`);

    return this.prisma.enrichmentResult.findFirst({
      where: { prospectId, tenantId },
      include: { prospect: true },
    });
  }

  async suggestReview(
    resultId: string,
    tenantId: string,
    userId: string,
    recommendedStatus: string,
    notes?: string,
  ) {
    const result = await this.prisma.enrichmentResult.findFirst({ where: { id: resultId, tenantId } });
    if (!result) throw new NotFoundException(`Resultado ${resultId} no encontrado`);
    return this.prisma.enrichmentResult.update({
      where: { id: resultId },
      data: { recommendedStatus, recommendNotes: notes ?? null, recommendedBy: userId },
    });
  }

  async getOutreachQueue(tenantId: string) {
    return this.prisma.prospect.findMany({
      where: { tenantId, estado: 'LISTO_OUTREACH', deletedAt: null },
      orderBy: [{ prioridad: 'asc' }, { score: 'desc' }],
      take: 50,
      select: {
        id: true, nombreEmpresa: true, email: true, telefono: true,
        ciudad: true, rubro: true, score: true, prioridad: true,
        oportunidadDetectada: true, servicioSugerido: true,
      },
    });
  }

  private async runAnalysis(jobId: string, tenantId: string, prospect: any) {
    await this.prisma.enrichmentJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    try {
      // ── Fase A: Playwright — determinístico, 0 tokens ─────────────────────
      this.logger.log(`[Job ${jobId}] Fase A: Playwright auditando ${prospect.website ?? 'sin web'}`);
      const signals = await this.playwrightAudit.auditWebsite(prospect.website);

      // ── Fase B: Razonamiento comercial — única llamada a Claude ───────────
      this.logger.log(`[Job ${jobId}] Fase B: razonamiento comercial`);
      const reasoningRaw = await this.reasonCommercially(prospect, signals);
      const data = this.parseJson<Partial<OpportunityAnalysis>>(reasoningRaw) ?? {};

      const opportunityScore = this.computeOpportunityScore(data);
      const oppsJson = (data.opportunities ?? []) as unknown as import('@prisma/client').Prisma.InputJsonValue;
      const signalsJson = signals as unknown as import('@prisma/client').Prisma.InputJsonValue;

      await this.prisma.enrichmentResult.upsert({
        where: { prospectId: prospect.id },
        create: {
          tenantId,
          prospectId: prospect.id,
          jobId,
          opportunities: oppsJson,
          signals: signalsJson,
          estimatedTicket: data.estimatedTicket ?? null,
          priority: data.priority ?? null,
          opportunityScore,
          confianza: data.confianza ?? null,
          summary: data.summary ?? null,
          contactable: true,
          reviewStatus: 'PENDING',
          rawOutput: reasoningRaw,
        },
        update: {
          opportunities: oppsJson,
          signals: signalsJson,
          estimatedTicket: data.estimatedTicket ?? null,
          priority: data.priority ?? null,
          opportunityScore,
          confianza: data.confianza ?? null,
          summary: data.summary ?? null,
          reviewStatus: 'PENDING',
          rawOutput: reasoningRaw,
          jobId,
        },
      });

      await this.prisma.prospect.updateMany({
        where: { id: prospect.id, tenantId, estado: 'INVESTIGADO' },
        data: { estado: 'ENRIQUECIDO' },
      });

      await this.prisma.enrichmentJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          agentOutput: `Score: ${opportunityScore} | Prioridad: ${data.priority ?? 'N/A'} | Ticket: USD ${data.estimatedTicket ?? 0} | Oportunidades: ${data.opportunities?.length ?? 0} | Web: ${signals.accessible ? 'OK' : signals.noWebsite ? 'sin web' : 'inaccesible'}`,
        },
      });
    } catch (err) {
      this.logger.error(`[AnalysisJob ${jobId}] Failed: ${err.message}`);
      await this.prisma.enrichmentJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', completedAt: new Date(), errorMessage: String(err.message) },
      });
    }
  }

  private async reasonCommercially(prospect: any, signals: AuditSignals): Promise<string> {
    const prompt = COMMERCIAL_REASONING_PROMPT(prospect, signals);
    const signalsJson = JSON.stringify(signals);

    this.logger.log(`[Phase B diag] signals keys: ${Object.keys(signals).length} | signals size: ${signalsJson.length} chars | prompt size: ${prompt.length} chars`);

    const start = Date.now();
    const result = await this.claude.runText(prompt, {
      model: 'claude-sonnet-4-6',
      timeoutMs: 120_000,
    });
    this.logger.log(`[Phase B diag] Claude ms: ${Date.now() - start} | output size: ${result.length} chars`);

    return result;
  }

  private computeOpportunityScore(data: Partial<OpportunityAnalysis>): number {
    const opps = data.opportunities ?? [];
    if (!opps.length) return 0;

    const highCount = opps.filter(o => o.impact === 'HIGH').length;
    const medCount  = opps.filter(o => o.impact === 'MEDIUM').length;
    const base = Math.min(highCount * 30 + medCount * 15, 80);

    const avgConfidence = opps.reduce((s, o) => s + (o.confidence ?? 0), 0) / opps.length;
    const confMult = data.confianza === 'ALTA' ? 1.0 : data.confianza === 'MEDIA' ? 0.85 : 0.65;
    const ticketBonus = (data.estimatedTicket ?? 0) >= 3000 ? 10 : (data.estimatedTicket ?? 0) >= 1500 ? 5 : 0;

    return Math.round(Math.min(base * confMult * (avgConfidence / 100) + ticketBonus, 100));
  }

  private parseJson<T>(raw: string): T | null {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }

}
