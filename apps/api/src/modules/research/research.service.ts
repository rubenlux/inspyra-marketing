import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateResearchJobDto } from './dto/create-research-job.dto';
import type { DiscoveryProvider, RawCompany } from './providers/discovery-provider.interface';
import { DiscoveryInfrastructureError } from './providers/discovery-provider.interface';
import { GoogleMapsDiscoveryProvider } from './providers/google-maps.provider';
import { AgenticDiscoveryProvider } from './providers/agentic.provider';
import { EvidenceValidator } from './evidence/evidence-validator';
import { QualificationSignalsDetector } from './qualification/qualification-signals.detector';
import { ContactAcquisitionService } from './contact/contact-acquisition.service';
import { SonnetEvaluator } from './evaluation/sonnet-evaluator';
import type { ContactAcquisitionResult } from './contact/contact-acquisition.types';
import type { QualificationSignals } from './qualification/qualification-signals';
import { ClaudeRunnerService } from '../ia-core/services/claude-runner.service';
import { WEBSITE_AUDIT_PROMPT } from './prompts/website-audit.prompt';
import { BUSINESS_OPPORTUNITY_PROMPT } from './prompts/business-opportunity.prompt';
import { ProspectPromoter } from './prospect/prospect-promoter';

export interface WebsiteAuditResult {
  empresa: string;
  dominio: string;
  rubroEstimado: string;
  auditScore: number;
  commercialOpportunityScore: number;
  erroresVisibles: string[];
  hallazgos: {
    seo:          { score: number; issues: string[] };
    frontend:     { score: number; issues: string[] };
    performance:  { score: number; issues: string[] };
    seguridad:    { score: number; issues: string[] };
    arquitectura: { stack: string[]; cms: string | null; issues: string[] };
  };
  severidad: {
    critico: string[];
    alto:    string[];
    medio:   string[];
    bajo:    string[];
  };
  serviciosSugeridos: string[];
  serviceFits?: Record<string, number>;
  outreachBrief: string;
}

export interface BusinessOpportunityResult {
  businessModel: string[];
  revenueOpportunities: string[];
  topServices: string[];
  estimatedTicket: number;
  reasoning: string;
  summary: string;
}

@Injectable()
export class ResearchService {
  private readonly logger = new Logger(ResearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly evidenceValidator: EvidenceValidator,
    private readonly qualificationDetector: QualificationSignalsDetector,
    private readonly contactAcquisition: ContactAcquisitionService,
    private readonly sonnetEvaluator: SonnetEvaluator,
    private readonly claude: ClaudeRunnerService,
    private readonly prospectPromoter: ProspectPromoter,
  ) {}

  // ── Public API ───────────────────────────────────────────────────────────────

  async createJob(dto: CreateResearchJobDto, tenantId: string, userId: string) {
    const job = await this.prisma.researchJob.create({
      data: {
        tenantId,
        query: dto.query,
        limit: dto.limit ?? 50,
        createdBy: userId,
        status: 'PENDING',
      },
    });

    setImmediate(() =>
      this.runPipeline(job.id, tenantId, dto.query, dto.limit ?? 50).catch(err =>
        this.logger.error(`[Job ${job.id}] Unhandled: ${err.message}`),
      ),
    );

    return job;
  }

  async getJob(jobId: string, tenantId: string) {
    const job = await this.prisma.researchJob.findFirst({ where: { id: jobId, tenantId } });
    if (!job) throw new NotFoundException(`Research job ${jobId} not found`);
    return job;
  }

  async listJobs(tenantId: string) {
    return this.prisma.researchJob.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true, query: true, status: true,
        candidatesFound: true, prospectsFound: true,
        errorMessage: true, createdAt: true, startedAt: true, completedAt: true, limit: true,
      },
    });
  }

  async getCandidates(jobId: string, tenantId: string) {
    const job = await this.prisma.researchJob.findFirst({ where: { id: jobId, tenantId } });
    if (!job) throw new NotFoundException(`Research job ${jobId} not found`);

    return this.prisma.researchCandidate.findMany({
      where: { jobId },
      orderBy: [{ status: 'asc' }, { score: 'desc' }],
    });
  }

  // ── On-demand analysis (user-triggered, single candidate) ───────────────────

  async analyzeCandidate(candidateId: string, tenantId: string) {
    const raw = await this.prisma.researchCandidate.findFirst({
      where: { id: candidateId, tenantId },
    });
    if (!raw) throw new NotFoundException(`Candidato ${candidateId} no encontrado`);
    const candidate = raw as typeof raw & { contactData: ContactAcquisitionResult | null };

    const cd = candidate.contactData;
    const hasWebsite = !!candidate.website;

    // Derive qualification signals from stored contactData
    const qualificationSignals: QualificationSignals = {
      hasWebsite,
      hasGBP:         true, // all Google Maps candidates have a Places entry
      hasInstagram:   cd ? (cd.instagram.length > 0 ? true  : (hasWebsite ? false : null))
                         : (candidate.instagram ? true : null),
      hasFacebook:    cd ? (cd.facebook.length  > 0 ? true  : (hasWebsite ? false : null)) : null,
      hasLinkedIn:    cd ? (cd.linkedin.length   > 0 ? true  : (hasWebsite ? false : null))
                         : (candidate.linkedin  ? true : null),
      hasWhatsapp:    cd ? (cd.whatsapp.length   > 0 ? true  : (hasWebsite ? false : null)) : null,
      hasEcommerce:   null,
      hasAgenda:      null,
      hasContactForm: null,
      sourceChecked:  hasWebsite ? 'website' : 'no_website',
    };

    const company: RawCompany = {
      nombreEmpresa:     candidate.nombreEmpresa,
      ciudad:            candidate.ciudad            ?? undefined,
      pais:              candidate.pais              ?? undefined,
      rubro:             candidate.rubro             ?? undefined,
      website:           candidate.website           ?? undefined,
      instagram:         candidate.instagram         ?? undefined,
      linkedin:          candidate.linkedin          ?? undefined,
      descripcion:       candidate.descripcion       ?? undefined,
      empleadosEstimado: candidate.empleadosEstimado ?? undefined,
      añosFundacion:     candidate.anosFundacion     ?? undefined,
      facturacionEstimada: candidate.facturacionEstimada ?? undefined,
      presenciaDigital:  candidate.presenciaDigital as RawCompany['presenciaDigital'],
      qualificationSignals,
      contactData:       cd ?? undefined,
    };

    const [evaluation] = await this.sonnetEvaluator.evaluateBatch([company], [0]);

    // Persist the analysis result so the frontend can refetch and show it
    await this.prisma.researchCandidate.update({
      where: { id: candidateId },
      data: {
        score:               evaluation.score,
        scoreBreakdown:      evaluation.scoreBreakdown ?? {},
        reasoning:           evaluation.reasoning,
        discardReason:       evaluation.discardReason,
        problemasDetectados: evaluation.problemasDetectados ?? [],
        oportunidadDetectada: evaluation.oportunidadDetectada,
        servicioSugerido:    evaluation.servicioSugerido,
        estimatedTicketUsd:  evaluation.estimatedTicketUsd,
      },
    });

    return evaluation;
  }

  // ── Website Audit ────────────────────────────────────────────────────────────

  async websiteAudit(rawUrl: string): Promise<WebsiteAuditResult> {
    const normalizedUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    const dominio = new URL(normalizedUrl).hostname;

    let html = '';
    let headersText = '';
    try {
      const res = await fetch(normalizedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InspyraBot/1.0; +https://inspyra.agency)' },
        signal: AbortSignal.timeout(14000),
      });
      const SECURITY_HEADERS = [
        'strict-transport-security','content-security-policy','x-frame-options',
        'x-content-type-options','referrer-policy','permissions-policy',
        'x-xss-protection','server','x-powered-by','cf-ray','via',
      ];
      const captured: string[] = [];
      for (const h of SECURITY_HEADERS) {
        const v = res.headers.get(h);
        if (v) captured.push(`${h}: ${v}`);
        else captured.push(`${h}: (ausente)`);
      }
      headersText = captured.join('\n');

      const raw = await res.text();
      html = raw
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .slice(0, 20000);
    } catch (err) {
      throw new BadRequestException(`No se pudo acceder a ${normalizedUrl}: ${(err as Error).message}`);
    }

    const fullAuditPrompt = WEBSITE_AUDIT_PROMPT(normalizedUrl, dominio, headersText, html);

    let raw: string;
    try {
      raw = await this.claude.runText(fullAuditPrompt, {
        model: 'claude-sonnet-4-6',
        timeoutMs: 180 * 1000,
        allowedTools: 'none',
      });
    } catch (err) {
      throw new BadRequestException(`Error en análisis IA: ${(err as Error).message}`);
    }

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new BadRequestException('El agente no devolvió JSON válido');

    try {
      const result = JSON.parse(match[0]) as WebsiteAuditResult;
      result.dominio = dominio;
      return result;
    } catch {
      throw new BadRequestException('Error al parsear resultado del agente');
    }
  }

  async analyzeBusinessOpportunity(
    empresa: string,
    rubro: string,
    website: string,
    googleMapsData?: Record<string, any>,
    websiteAudit?: Record<string, any>,
    contactData?: Record<string, any>,
  ): Promise<BusinessOpportunityResult> {
    const prompt = BUSINESS_OPPORTUNITY_PROMPT(
      empresa,
      rubro,
      website,
      googleMapsData || {},
      websiteAudit || {},
      contactData || {},
    );

    let raw: string;
    try {
      raw = await this.claude.runText(prompt, {
        model: 'claude-sonnet-4-6',
        timeoutMs: 180 * 1000,
        allowedTools: 'none',
      });
    } catch (err) {
      throw new BadRequestException(`Error en análisis de oportunidades: ${(err as Error).message}`);
    }

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new BadRequestException('El agente no devolvió JSON válido');

    try {
      const result = JSON.parse(match[0]) as BusinessOpportunityResult;
      return result;
    } catch {
      throw new BadRequestException('Error al parsear resultado del agente');
    }
  }

  // ── Pipeline Orchestrator ───────────────────────────────────────────────────

  private async runPipeline(jobId: string, tenantId: string, query: string, limit: number) {
    await this.prisma.researchJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    this.logger.log(`[Job ${jobId}] Pipeline start | "${query}" | limit: ${limit}`);

    try {
      // ── Phase 1: Real web search discovery ──────────────────────────────────
      await this.updateJobOutput(jobId, `[Fase 1/4] Buscando empresas reales: "${query}"…`);

      const provider = this.getDiscoveryProvider();
      const { companies: rawCompanies, sinEvidencia: sinEvidenciaCount } = await provider.discover(query, limit);

      if (rawCompanies.length === 0) {
        await this.prisma.researchJob.update({
          where: { id: jobId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            candidatesFound: 0,
            prospectsFound: 0,
            agentOutput: `Discovery: 0 empresas reales encontradas para "${query}". ${sinEvidenciaCount} sin evidencia descartadas.`,
          },
        });
        return;
      }

      // ── Phase 2: Save DISCOVERED & Validate Evidence ────────────────────────
      await this.updateJobOutput(jobId, `[Fase 2/4] Validando evidencia real de ${rawCompanies.length} empresas…`);
      const savedCandidates = await this.saveCandidates(jobId, tenantId, rawCompanies);
      await this.prisma.researchJob.update({ where: { id: jobId }, data: { candidatesFound: rawCompanies.length } });

      const validatedIndices: number[] = [];
      const invalidatedIndices: number[] = [];

      for (let i = 0; i < rawCompanies.length; i++) {
        const c = rawCompanies[i];
        const evidenceResult = await this.evidenceValidator.validate(c);
        const candidate = savedCandidates[i];

        if (evidenceResult.valid) {
          validatedIndices.push(i);
        } else {
          invalidatedIndices.push(i);
          if (candidate) {
            await this.prisma.researchCandidate.update({
              where: { id: candidate.id },
              data: { status: 'DISCARDED', discardReason: `Evidencia no verificable: ${evidenceResult.details}` },
            });
          }
        }
      }

      if (validatedIndices.length === 0) {
        await this.prisma.researchJob.update({
          where: { id: jobId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            prospectsFound: 0,
            agentOutput: `Discovery: ${rawCompanies.length} encontradas, 0 con evidencia verificable.`,
          },
        });
        return;
      }

      // ── Phase 2b: Qualification Signals + Contact Acquisition (HTTP, sin LLMs) ──
      await this.updateJobOutput(jobId, `[Fase 2b/2] Detectando contactos y señales digitales…`);
      await Promise.all(
        validatedIndices.map(async (i) => {
          const [qs, cd] = await Promise.all([
            this.qualificationDetector.detectSignals(rawCompanies[i]),
            this.contactAcquisition.acquire(rawCompanies[i]),
          ]);
          rawCompanies[i].qualificationSignals = qs;
          rawCompanies[i].contactData = cd;
        }),
      );

      // ── Persist contact data on each validated candidate ────────────────────
      await Promise.all(
        validatedIndices.map(async (i) => {
          const candidate = savedCandidates[i];
          if (!candidate) return;
          const cd = rawCompanies[i].contactData;
          if (cd) {
            await this.prisma.researchCandidate.update({
              where: { id: candidate.id },
              data: { contactData: cd as object },
            });
          }
        }),
      );

      // ── Phase 3: Crear Prospect automáticamente (sin Claude) ─────────────────
      await this.updateJobOutput(jobId, `[Fase 3/3] Promoviendo a Prospect…`);
      let prospectsCreated = 0;

      await Promise.all(
        validatedIndices.map(async (i) => {
          try {
            const company = rawCompanies[i];
            const prospect = await this.createProspectFromDiscovery(tenantId, company);
            if (prospect) {
              prospectsCreated++;
              await this.prisma.researchCandidate.update({
                where: { id: savedCandidates[i].id },
                data: { status: 'PROMOTED', prospectId: prospect.id },
              });
            }
          } catch (err) {
            this.logger.error(`[Job ${jobId}] Failed to promote ${rawCompanies[i].nombreEmpresa}: ${err.message}`);
          }
        }),
      );

      await this.prisma.researchJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          prospectsFound: prospectsCreated,
          agentOutput: `Discovery completo: ${validatedIndices.length} empresas con contactos → ${prospectsCreated} Prospect creados. 0 tokens IA usados.`,
        },
      });
    } catch (err) {
      const msg = (err as Error).message;
      this.logger.error(`[Job ${jobId}] Failed: ${msg}`);
      await this.prisma.researchJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', completedAt: new Date(), errorMessage: msg },
      });
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private async saveCandidates(jobId: string, tenantId: string, companies: RawCompany[]) {
    return Promise.all(
      companies.map((c, i) =>
        this.prisma.researchCandidate.create({
          data: {
            jobId, tenantId, candidateIndex: i, nombreEmpresa: c.nombreEmpresa,
            ciudad: c.ciudad, pais: c.pais, rubro: c.rubro,
            website: c.website, instagram: c.instagram, linkedin: c.linkedin,
            descripcion: c.descripcion, empleadosEstimado: c.empleadosEstimado,
            anosFundacion: c.añosFundacion, presenciaDigital: c.presenciaDigital as object,
            facturacionEstimada: c.facturacionEstimada, status: 'DISCOVERED',
          },
        }),
      ),
    );
  }

  private async createProspectFromDiscovery(tenantId: string, company: RawCompany) {
    const cd = company.contactData;
    const score = 65; // Default moderate score for discovered companies
    const nivel = score >= 80 ? 'ALTA' : score >= 50 ? 'MEDIA' : 'BAJA';
    const prioridad = score >= 80 ? 'ALTA' : score >= 50 ? 'MEDIA' : 'BAJA';

    return this.prisma.prospect.create({
      data: {
        tenantId,
        nombreEmpresa: company.nombreEmpresa,
        ciudad: company.ciudad,
        pais: company.pais,
        rubro: company.rubro,
        website: company.website,
        email: cd?.emails?.[0] ?? null,
        telefono: cd?.phones?.[0] ?? company.telefono ?? null,
        whatsapp: cd?.whatsapp?.[0] ?? null,
        instagram: cd?.instagram?.[0] ?? company.instagram ?? null,
        facebook: cd?.facebook?.[0] ?? null,
        linkedin: cd?.linkedin?.[0] ?? company.linkedin ?? null,
        empleadosEstimado: company.empleadosEstimado,
        problemasEncontrados: [],
        currentProblems: [],
        nivelOportunidad: nivel,
        score,
        prioridad,
        fuente: company.source === 'google_maps' ? 'GOOGLE_MAPS' : 'MANUAL',
        detectadoPor: 'IA',
        estado: 'NUEVO',
      },
    });
  }

  private getDiscoveryProvider(): DiscoveryProvider {
    const type = process.env.DISCOVERY_PROVIDER ?? 'google_maps';
    if (type === 'agentic_web_search') {
      return new AgenticDiscoveryProvider(
        (p, m, i, t) => this.claude.runAgentic(p, { model: m, idleTimeoutMs: i, timeoutMs: t }),
        (p, m, t) => this.claude.runText(p, { model: m, timeoutMs: t }),
        this.logger,
      );
    }
    return new GoogleMapsDiscoveryProvider();
  }

  private async updateJobOutput(jobId: string, msg: string) {
    await this.prisma.researchJob.update({ where: { id: jobId }, data: { agentOutput: msg } });
  }
}
