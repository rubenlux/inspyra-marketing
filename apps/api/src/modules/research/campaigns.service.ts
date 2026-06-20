import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import type { DiscoveryCampaign } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import type { WebsiteAuditResult } from './research.service';

// ── Types ──────────────────────────────────────────────────────────────────────

interface RawCompany {
  nombreEmpresa: string;
  ciudad?: string;
  pais?: string;
  provincia?: string;
  rubro?: string;
  website?: string;
  instagram?: string;
  linkedin?: string;
  descripcion?: string;
  empleadosEstimado?: number;
  añosFundacion?: string;
}

// ── Templates ─────────────────────────────────────────────────────────────────

interface CampaignTemplate {
  name: string;
  objective: string;
  strategyPrompt: string;
  servicesToSell: string[];
  targetMarkets: string[];
  targetIndustries: string[];
  problemSignals: string[];
  opportunitySignals: string[];
  threshold: number;
  automationLevel: string;
  preferredSource: string;
  defaultLimit: number;
}

const CAMPAIGN_TEMPLATES: Record<string, CampaignTemplate> = {
  'seo-latam': {
    name: 'SEO LATAM',
    objective: 'Detectar empresas activas en LATAM con SEO orgánico débil o nulo',
    strategyPrompt: `Buscamos pymes con web funcional pero invisible en Google local.
Tienen clientes pero no los encuentran online. El problema es concreto:
sin meta tags, sin Google Business optimizado, sin contenido orientado a búsquedas.
Pierden clientes frente a competidores que sí invierten en SEO.
Priorizar empresas medianas con rubro competitivo localmente.
Descartar grandes corporaciones con equipo de marketing interno.`,
    servicesToSell: ['SEO Local', 'SEO Técnico'],
    targetMarkets: [],
    targetIndustries: [],
    problemSignals: ['no_schema', 'duplicate_meta', 'no_sitemap'],
    opportunitySignals: ['empresa activa', 'tiene redes sociales', 'rubro competitivo local'],
    threshold: 65,
    automationLevel: 'MANUAL',
    preferredSource: 'WEB_SEARCH',
    defaultLimit: 25,
  },

  'hostingguard-recovery': {
    name: 'HostingGuard Recovery',
    objective: 'Detectar sitios con seguridad web deficiente para vender HostingGuard',
    strategyPrompt: `Buscamos empresas con presencia web que no saben que su sitio es vulnerable.
La señal no es el sector — es el patrón de headers HTTP: sin HSTS, sin CSP, sin X-Frame-Options.
El pitch es directo: "Tu sitio tiene vulnerabilidades activas. HostingGuard las cierra automáticamente."
Priorizar empresas con dominio propio y web funcional.
Descartar landing pages estáticas, micrositios de una página y sitios en Wix o Squarespace.`,
    servicesToSell: ['HostingGuard'],
    targetMarkets: [],
    targetIndustries: [],
    problemSignals: ['ssl_error', 'security_headers_missing', 'slow_site', 'outdated_wordpress'],
    opportunitySignals: ['dominio propio activo', 'empresa mediana o grande', 'web funcional'],
    threshold: 70,
    automationLevel: 'MANUAL',
    preferredSource: 'WEB_SEARCH',
    defaultLimit: 20,
  },

  'web-modernization': {
    name: 'Web Modernization',
    objective: 'Detectar empresas con sitios web desactualizados para vender Desarrollo Web',
    strategyPrompt: `Buscamos empresas con sitios de más de 5 años que dañan la imagen de marca.
El problema es visible: diseño de 2015, sin responsive, carga lenta en móvil, sin SSL.
Estas empresas pierden clientes porque su competencia tiene webs modernas y ellos no.
El pitch: "Tu web está costando clientes. Un rediseño completo puede cambiar eso."
Priorizar empresas con dominio propio activo y presencia en redes sociales.
Descartar empresas sin presupuesto visible (microemprendimientos sin empleados).`,
    servicesToSell: ['Desarrollo Web'],
    targetMarkets: [],
    targetIndustries: [],
    problemSignals: ['outdated_design', 'poor_mobile', 'poor_ux'],
    opportunitySignals: ['empresa activa', 'tiene redes sociales activas', 'sector con alta competencia online'],
    threshold: 60,
    automationLevel: 'MANUAL',
    preferredSource: 'WEB_SEARCH',
    defaultLimit: 20,
  },
};

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class CampaignsService implements OnModuleDestroy {
  private readonly logger = new Logger(CampaignsService.name);
  private readonly projectRoot = path.resolve(__dirname, '../../../../../');

  constructor(private readonly prisma: PrismaService) {}

  async onModuleDestroy() {
    // Mark any RUNNING discovery jobs as FAILED so they don't stay orphaned on hot reload / shutdown
    await this.prisma.researchJob.updateMany({
      where: { status: 'RUNNING', jobType: 'DISCOVERY' },
      data: { status: 'FAILED', completedAt: new Date(), errorMessage: 'Process terminated during execution' },
    });
  }

  // ── Templates ──────────────────────────────────────────────────────────────

  getTemplates() {
    return Object.entries(CAMPAIGN_TEMPLATES).map(([slug, template]) => ({
      slug,
      ...template,
    }));
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  async create(tenantId: string, userId: string, dto: CreateCampaignDto) {
    const base: Partial<CampaignTemplate> = dto.fromTemplate
      ? (CAMPAIGN_TEMPLATES[dto.fromTemplate] ?? {})
      : {};

    if (dto.fromTemplate && !CAMPAIGN_TEMPLATES[dto.fromTemplate]) {
      throw new BadRequestException(`Template "${dto.fromTemplate}" not found. Available: ${Object.keys(CAMPAIGN_TEMPLATES).join(', ')}`);
    }

    const merged = { ...base, ...this.stripUndefined(dto) };

    if (merged.automationLevel && merged.automationLevel !== 'MANUAL') {
      throw new BadRequestException('DiscoveryCampaign currently supports MANUAL mode only');
    }

    const name = merged.name;
    if (!name) throw new BadRequestException('name is required (or use fromTemplate which provides a default name)');

    const servicesToSell = merged.servicesToSell ?? [];
    if (servicesToSell.length === 0) throw new BadRequestException('servicesToSell requires at least 1 service');

    const objective = merged.objective;
    if (!objective) throw new BadRequestException('objective is required');

    const slug = this.toSlug(name);

    const existing = await this.prisma.discoveryCampaign.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
    });
    if (existing) {
      throw new ConflictException(`A campaign with slug "${slug}" already exists for this tenant`);
    }

    return this.prisma.discoveryCampaign.create({
      data: {
        tenantId,
        name,
        slug,
        objective,
        strategyPrompt:    merged.strategyPrompt    ?? null,
        servicesToSell:    servicesToSell,
        targetMarkets:     merged.targetMarkets     ?? [],
        targetIndustries:  merged.targetIndustries  ?? [],
        problemSignals:    merged.problemSignals     ?? [],
        opportunitySignals: merged.opportunitySignals ?? [],
        threshold:         merged.threshold         ?? 65,
        automationLevel:   (merged.automationLevel  ?? 'MANUAL') as never,
        preferredSource:   (merged.preferredSource  ?? 'WEB_SEARCH') as never,
        defaultLimit:      merged.defaultLimit       ?? 20,
      },
    });
  }

  // ── List ───────────────────────────────────────────────────────────────────

  async findAll(tenantId: string) {
    const campaigns = await this.prisma.discoveryCampaign.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      campaigns.map(async (c) => {
        const stats = await this.prisma.researchJob.aggregate({
          where: { campaignId: c.id, tenantId },
          _sum:   { candidatesFound: true, prospectsFound: true },
          _count: { id: true },
          _max:   { completedAt: true },
        });
        return {
          ...c,
          totalRuns:       stats._count.id,
          totalCandidates: stats._sum.candidatesFound  ?? 0,
          totalPromoted:   stats._sum.prospectsFound   ?? 0,
          lastRunAt:       stats._max.completedAt      ?? null,
        };
      }),
    );
  }

  // ── Detail ─────────────────────────────────────────────────────────────────

  async findOne(id: string, tenantId: string) {
    const campaign = await this.prisma.discoveryCampaign.findFirst({
      where: { id, tenantId },
      include: {
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id:             true,
            status:         true,
            candidatesFound: true,
            prospectsFound:  true,
            sourceType:     true,
            createdAt:      true,
            completedAt:    true,
            errorMessage:   true,
          },
        },
      },
    });
    if (!campaign) throw new NotFoundException(`Campaign ${id} not found`);
    return campaign;
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  async update(id: string, tenantId: string, dto: UpdateCampaignDto) {
    const campaign = await this.prisma.discoveryCampaign.findFirst({ where: { id, tenantId } });
    if (!campaign) throw new NotFoundException(`Campaign ${id} not found`);

    if (dto.servicesToSell !== undefined && dto.servicesToSell.length === 0) {
      throw new BadRequestException('servicesToSell requires at least 1 service');
    }

    if (dto.automationLevel && dto.automationLevel !== 'MANUAL') {
      throw new BadRequestException('DiscoveryCampaign currently supports MANUAL mode only');
    }

    const data: Record<string, unknown> = { ...this.stripUndefined(dto) };

    if (dto.name && dto.name !== campaign.name) {
      const newSlug = this.toSlug(dto.name);
      const conflict = await this.prisma.discoveryCampaign.findUnique({
        where: { tenantId_slug: { tenantId, slug: newSlug } },
      });
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`A campaign with slug "${newSlug}" already exists`);
      }
      data['slug'] = newSlug;
    }

    return this.prisma.discoveryCampaign.update({ where: { id }, data });
  }

  // ── Status ─────────────────────────────────────────────────────────────────

  async updateStatus(id: string, tenantId: string, status: string) {
    if (!['ACTIVE', 'PAUSED', 'ARCHIVED'].includes(status)) {
      throw new BadRequestException('status must be ACTIVE, PAUSED, or ARCHIVED');
    }
    const campaign = await this.prisma.discoveryCampaign.findFirst({ where: { id, tenantId } });
    if (!campaign) throw new NotFoundException(`Campaign ${id} not found`);
    return this.prisma.discoveryCampaign.update({ where: { id }, data: { status: status as never } });
  }

  // ── Run ────────────────────────────────────────────────────────────────────

  async run(id: string, tenantId: string, userId: string, limit?: number) {
    const campaign = await this.prisma.discoveryCampaign.findFirst({ where: { id, tenantId } });
    if (!campaign) throw new NotFoundException(`Campaign ${id} not found`);
    if (campaign.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Campaign is ${campaign.status} — only ACTIVE campaigns can be run`,
      );
    }

    const job = await this.prisma.researchJob.create({
      data: {
        tenantId,
        campaignId:  campaign.id,
        query:       campaign.name,
        limit:       limit ?? campaign.defaultLimit,
        status:      'PENDING',
        jobType:     'DISCOVERY',
        sourceType:  campaign.preferredSource as never,
        createdBy:   userId,
      },
    });

    setImmediate(() =>
      this.runDiscoveryPipeline(job.id, tenantId, campaign, job.limit).catch(err =>
        this.logger.error(`[Job ${job.id}] Unhandled: ${err.message}`),
      ),
    );

    return {
      job,
      campaign: { id: campaign.id, name: campaign.name, threshold: campaign.threshold },
      _meta: { pipelineReady: true },
    };
  }

  // ── Discovery Pipeline ─────────────────────────────────────────────────────

  private async runDiscoveryPipeline(
    jobId: string,
    tenantId: string,
    campaign: DiscoveryCampaign,
    limit: number,
  ) {
    await this.prisma.researchJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt: new Date() },
    });
    this.logger.log(`[Job ${jobId}] Discovery pipeline start | "${campaign.name}" | limit: ${limit}`);

    try {
      // ── Phase 1: Discover companies via web_search ──────────────────────────
      await this.updateJobOutput(jobId, '[1/5] Generando queries y buscando empresas…');
      const rawCompanies = await this.discoverWithWebSearch(campaign, limit);
      this.logger.log(`[Job ${jobId}] Phase 1 done — ${rawCompanies.length} companies found`);

      // ── Phase 2: Deduplication ──────────────────────────────────────────────
      await this.updateJobOutput(jobId, `[2/5] Deduplicando ${rawCompanies.length} candidatos…`);
      const { unique, duplicateCount } = await this.deduplicateBatch(rawCompanies, tenantId, campaign.id);
      this.logger.log(`[Job ${jobId}] Phase 2 done — ${unique.length} unique, ${duplicateCount} duplicates`);

      // Save all candidates (including duplicates) to ResearchCandidate
      const savedCandidates = await this.saveCandidates(jobId, tenantId, rawCompanies, unique);
      await this.prisma.researchJob.update({
        where: { id: jobId },
        data: { candidatesFound: rawCompanies.length },
      });

      // ── Phase 3: Website audit on unique candidates with website (concurrency=3)
      await this.updateJobOutput(jobId, `[3/5] Auditando ${unique.length} sitios…`);
      const auditResults: Map<string, WebsiteAuditResult> = new Map();
      const AUDIT_CONCURRENCY = 3;

      const auditQueue = unique.filter(c => c.website);
      for (let i = 0; i < auditQueue.length; i += AUDIT_CONCURRENCY) {
        const batch = auditQueue.slice(i, i + AUDIT_CONCURRENCY);
        await Promise.all(
          batch.map(async (company) => {
            const candidate = savedCandidates.get(company.nombreEmpresa);
            try {
              const audit = await this.runWebsiteAudit(company.website!);
              auditResults.set(company.nombreEmpresa, audit);
              if (candidate) {
                await this.prisma.researchCandidate.update({
                  where: { id: candidate.id },
                  data: {
                    auditScore:      audit.auditScore,
                    commercialScore: audit.commercialOpportunityScore,
                    scoreBreakdown:  audit.serviceFits ? (audit.serviceFits as never) : undefined,
                  },
                });
              }
              const fitSummary = audit.serviceFits
                ? Object.entries(audit.serviceFits).map(([k, v]) => `${k}:${v}`).join(' ')
                : '';
              this.logger.log(`[Job ${jobId}] Audit OK — ${company.website} → commercial:${audit.commercialOpportunityScore} audit:${audit.auditScore} [${fitSummary}]`);
            } catch (err) {
              this.logger.warn(`[Job ${jobId}] Audit failed for ${company.website}: ${(err as Error).message}`);
            }
          }),
        );
        await this.updateJobOutput(jobId, `[3/5] Auditando… ${Math.min(i + AUDIT_CONCURRENCY, auditQueue.length)}/${auditQueue.length} completados`);
      }

      // ── Phase 4: Campaign fit + threshold ───────────────────────────────────
      await this.updateJobOutput(jobId, '[4/5] Evaluando campaign fit…');
      let prospectsFound = 0;
      const discardLog: Array<{ empresa: string; score: number; reason: string }> = [];

      // Count unique companies with no website — they skip audit entirely
      const noWebsiteCount = unique.filter(c => !c.website).length;

      for (const company of unique) {
        const audit = auditResults.get(company.nombreEmpresa);
        const candidate = savedCandidates.get(company.nombreEmpresa);

        if (!candidate) continue;

        if (!audit) {
          // No website or audit failed — mark discarded, track for funnel
          const reason = company.website ? 'audit_failed' : 'no_website';
          await this.prisma.researchCandidate.update({
            where: { id: candidate.id },
            data: { status: 'DISCARDED', discardReason: reason },
          });
          discardLog.push({ empresa: company.nombreEmpresa, score: 0, reason });
          continue;
        }

        const { fits, reason } = this.evaluateCampaignFit(audit, campaign);

        await this.prisma.researchCandidate.update({
          where: { id: candidate.id },
          data: {
            campaignFit:   fits,
            scoreBreakdown: audit.serviceFits ? (audit.serviceFits as never) : undefined,
          },
        });

        if (fits) {
          const prospect = await this.createProspectFromAudit(tenantId, company, audit, campaign);
          await this.prisma.researchCandidate.update({
            where: { id: candidate.id },
            data: { status: 'PROMOTED', prospectId: prospect.id },
          });
          prospectsFound++;
          this.logger.log(`[Job ${jobId}] PROMOTED ${company.nombreEmpresa} (score:${audit.commercialOpportunityScore}) → prospect ${prospect.id}`);
        } else {
          await this.prisma.researchCandidate.update({
            where: { id: candidate.id },
            data: { status: 'DISCARDED', discardReason: reason },
          });
          discardLog.push({ empresa: company.nombreEmpresa, score: audit.commercialOpportunityScore, reason });
          this.logger.log(`[Job ${jobId}] DISCARDED ${company.nombreEmpresa} — ${reason}`);
        }
      }

      // ── Phase 5: Finalize job + metrics ────────────────────────────────────
      await this.updateJobOutput(jobId, '[5/5] Actualizando métricas…');

      const auditFailedCount = discardLog.filter(d => d.reason === 'audit_failed').length;
      const scoreBelowCount  = discardLog.filter(d => d.reason !== 'audit_failed' && d.reason !== 'no_website').length;
      const topDiscards = discardLog
        .slice(0, 10)
        .map(d => `  • ${d.empresa} (score:${d.score}) — ${d.reason}`)
        .join('\n');

      await this.upsertDiscoveryMetrics(tenantId, campaign.id, {
        candidates:   rawCompanies.length,
        duplicates:   duplicateCount,
        noWebsite:    noWebsiteCount,
        auditFailed:  auditFailedCount,
        scoreBelow:   scoreBelowCount,
        audited:      auditResults.size,
        promoted:     prospectsFound,
      });

      const summary = [
        `=== DISCOVERY FUNNEL — ${campaign.name} ===`,
        `Encontrados:        ${rawCompanies.length}`,
        `Deduplicados:      -${duplicateCount}`,
        `Sin website:       -${noWebsiteCount}`,
        `Audit fallido:     -${auditFailedCount}`,
        `Score bajo:        -${scoreBelowCount}`,
        `Auditados:          ${auditResults.size}`,
        `PROMOVIDOS:         ${prospectsFound}`,
        ``,
        `Top descartados:`,
        topDiscards || '  (ninguno)',
      ].join('\n');

      await this.prisma.researchJob.update({
        where: { id: jobId },
        data: {
          status:         'COMPLETED',
          completedAt:    new Date(),
          prospectsFound,
          agentOutput:    summary,
        },
      });

      this.logger.log(`[Job ${jobId}] Pipeline complete — ${rawCompanies.length} found, ${prospectsFound} promoted`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[Job ${jobId}] Pipeline failed: ${msg}`);
      await this.prisma.researchJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', completedAt: new Date(), errorMessage: msg.slice(0, 1000) },
      });
    }
  }

  // ── Phase 1: Web Search Discovery ─────────────────────────────────────────

  private async discoverWithWebSearch(campaign: DiscoveryCampaign, limit: number): Promise<RawCompany[]> {
    // Step 1a: Generate 5 diversified contextual search queries
    const queries = await this.generateSearchQueries(campaign, 5);
    this.logger.log(`[Discovery] Queries (${queries.length}): ${queries.join(' | ')}`);

    // Step 1b: 3x overshoot per query — dedup will trim, but we want broad coverage
    const perQueryLimit = Math.ceil(limit / queries.length) * 3;
    const results: RawCompany[] = [];

    for (const query of queries) {
      try {
        const companies = await this.searchCompaniesForQuery(query, campaign, perQueryLimit);
        results.push(...companies);
        this.logger.log(`[Discovery] Query "${query}" → ${companies.length} companies`);
      } catch (err) {
        this.logger.warn(`[Discovery] Query "${query}" failed: ${(err as Error).message}`);
      }
    }

    // Keep generous headroom for dedup — do NOT trim aggressively here
    return results.slice(0, limit * 8);
  }

  private async generateSearchQueries(campaign: DiscoveryCampaign, count: number): Promise<string[]> {
    const signals = (campaign.problemSignals as string[]).slice(0, 4).join(', ');
    const markets = (campaign.targetMarkets as string[]).join(', ') || 'LATAM, Argentina, Chile, México';
    const industries = (campaign.targetIndustries as string[]).join(', ') || 'pymes, empresas locales';

    const prompt = `Eres un especialista en prospección B2B para una agencia digital.

Campaña: "${campaign.name}"
Objetivo: ${campaign.objective}
${campaign.strategyPrompt ? `Estrategia: ${campaign.strategyPrompt}` : ''}
Señales de problema: ${signals}
Mercados: ${markets}
Industrias objetivo: ${industries}

Genera exactamente ${count} queries de búsqueda web DIVERSIFICADAS para encontrar empresas reales.
Reglas:
- Cada query debe explorar un ángulo distinto (sector, ciudad, tipo de empresa, problema específico)
- Queries en español, orientadas a encontrar empresas con sitio web propio
- Variar la geografía entre las queries (diferentes países/ciudades de LATAM)
- Variar el sector cuando sea posible (no repetir el mismo rubro)
- El objetivo es MAXIMIZAR la cantidad de candidatos únicos encontrados

Devuelve SOLO un JSON array de strings, sin markdown:
["query 1", "query 2", "query 3", "query 4", "query 5"]`;

    const output = await this.spawnClaude(prompt, 'claude-sonnet-4-6', 60_000);
    const match = output.match(/\[[\s\S]*?\]/);
    if (!match) return [`empresas pymes ${campaign.objective.slice(0, 50)}`];

    try {
      const parsed = JSON.parse(match[0]) as string[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed.slice(0, count) : [`pymes ${campaign.name}`];
    } catch {
      return [`empresas pymes ${campaign.name} LATAM`];
    }
  }

  private async searchCompaniesForQuery(
    query: string,
    campaign: DiscoveryCampaign,
    limit: number,
  ): Promise<RawCompany[]> {
    const servicios = (campaign.servicesToSell as string[]).join(', ');

    const prompt = `Usa web_search para buscar: "${query}"

Objetivo: encontrar empresas reales que podrían necesitar: ${servicios}

Después de buscar, extrae hasta ${limit} empresas reales de los resultados.
Para cada empresa incluye: nombre, website (URL completa), ciudad, país, rubro y descripción breve.
Solo incluir empresas con sitio web propio (no redes sociales ni directorios).

Devuelve SOLO este JSON array, sin markdown:
[
  {
    "nombreEmpresa": "Nombre real",
    "website": "https://ejemplo.com",
    "ciudad": "Ciudad",
    "pais": "País",
    "rubro": "Sector/industria",
    "descripcion": "Qué hace la empresa"
  }
]`;

    const output = await this.spawnClaude(prompt, 'claude-sonnet-4-6', 90_000);
    const match = output.match(/\[[\s\S]*\]/);
    if (!match) return [];

    try {
      const parsed = JSON.parse(match[0]) as RawCompany[];
      return Array.isArray(parsed) ? parsed.filter(c => c.nombreEmpresa && c.website) : [];
    } catch {
      return [];
    }
  }

  // ── Phase 2: Deduplication ────────────────────────────────────────────────

  private normalizeDomain(urlOrDomain: string): string | null {
    try {
      const withScheme = urlOrDomain.startsWith('http') ? urlOrDomain : `https://${urlOrDomain}`;
      const hostname = new URL(withScheme).hostname.toLowerCase();
      return hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  }

  private async deduplicateBatch(
    companies: RawCompany[],
    tenantId: string,
    campaignId: string,
  ): Promise<{ unique: RawCompany[]; duplicateCount: number }> {
    // Level 1: intra-batch by domain
    const seenDomains = new Set<string>();
    const withDomains = companies.map(c => ({
      company: c,
      domain: c.website ? this.normalizeDomain(c.website) : null,
    }));

    const intraBatchUnique = withDomains.filter(({ company, domain }) => {
      if (!domain) return true; // no website — keep, will skip audit
      if (seenDomains.has(domain)) return false;
      seenDomains.add(domain);
      return true;
    });

    // Level 2: cross-run 30 days (same tenant + same domain in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentDomains = await this.prisma.researchCandidate.findMany({
      where: {
        tenantId,
        domainNormalized: { in: [...seenDomains] },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { domainNormalized: true },
    });
    const recentDomainSet = new Set(recentDomains.map(r => r.domainNormalized).filter(Boolean) as string[]);

    // Level 3: existing prospects by website domain
    const existingProspects = await this.prisma.prospect.findMany({
      where: { tenantId, website: { not: null } },
      select: { website: true },
    });
    const existingDomainSet = new Set(
      existingProspects
        .map(p => p.website ? this.normalizeDomain(p.website) : null)
        .filter(Boolean) as string[],
    );

    let duplicateCount = companies.length - intraBatchUnique.length; // intra-batch dupes
    const finalUnique: RawCompany[] = [];

    for (const { company, domain } of intraBatchUnique) {
      if (domain && (recentDomainSet.has(domain) || existingDomainSet.has(domain))) {
        duplicateCount++;
      } else {
        finalUnique.push(company);
      }
    }

    return { unique: finalUnique, duplicateCount };
  }

  // ── Save Candidates ────────────────────────────────────────────────────────

  private async saveCandidates(
    jobId: string,
    tenantId: string,
    all: RawCompany[],
    unique: RawCompany[],
  ): Promise<Map<string, { id: string }>> {
    const uniqueNames = new Set(unique.map(c => c.nombreEmpresa));
    const map = new Map<string, { id: string }>();

    await Promise.all(
      all.map(async (c, i) => {
        const domain = c.website ? this.normalizeDomain(c.website) : null;
        const isDuplicate = !uniqueNames.has(c.nombreEmpresa);

        const created = await this.prisma.researchCandidate.create({
          data: {
            jobId,
            tenantId,
            candidateIndex:   i,
            nombreEmpresa:    c.nombreEmpresa,
            ciudad:           c.ciudad,
            pais:             c.pais,
            rubro:            c.rubro,
            website:          c.website,
            instagram:        c.instagram,
            linkedin:         c.linkedin,
            descripcion:      c.descripcion,
            empleadosEstimado: c.empleadosEstimado,
            anosFundacion:    c.añosFundacion,
            domainNormalized: domain,
            isDuplicate,
            status:           isDuplicate ? 'DISCARDED' : 'DISCOVERED',
            discardReason:    isDuplicate ? 'duplicate' : undefined,
          },
        });
        map.set(c.nombreEmpresa, { id: created.id });
      }),
    );

    return map;
  }

  // ── Phase 3: Website Audit ────────────────────────────────────────────────

  private async runWebsiteAudit(rawUrl: string): Promise<WebsiteAuditResult> {
    const normalizedUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    const dominio = new URL(normalizedUrl).hostname;

    let html = '';
    let headersText = '';
    const res = await fetch(normalizedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InspyraBot/1.0; +https://inspyra.agency)' },
      signal: AbortSignal.timeout(14000),
    });

    const SECURITY_HEADERS = [
      'strict-transport-security', 'content-security-policy', 'x-frame-options',
      'x-content-type-options', 'referrer-policy', 'permissions-policy',
      'x-xss-protection', 'server', 'x-powered-by', 'cf-ray', 'via',
    ];
    headersText = SECURITY_HEADERS.map(h => {
      const v = res.headers.get(h);
      return v ? `${h}: ${v}` : `${h}: (ausente)`;
    }).join('\n');

    const raw = await res.text();
    html = raw
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .slice(0, 20000);

    const prompt = `Eres el Website Audit Agent de Inspyra. Auditá el sitio en 5 capas.

URL: ${normalizedUrl}

=== HEADERS HTTP ===
${headersText}

=== HTML ===
${html}

CATÁLOGO DE SERVICIOS INSPYRA (16 servicios — usar los IDs exactos en serviceFits):
- gbp-management: Gestión de Google Business Profile — "Tus clientes no te encuentran en Google Maps cuando buscan tu rubro en la zona"
- seo-local: SEO Local — "Tu negocio no aparece cuando alguien busca tu rubro en tu ciudad"
- review-management: Gestión de Reseñas — "Las reseñas online son el primer filtro que usan tus clientes para elegir"
- social-management: Gestión de Redes Sociales — "Tu competencia capta clientes en Instagram todos los días — vos no tenés presencia activa"
- crm-setup: Setup CRM — "Estás perdiendo oportunidades de venta porque no tenés un sistema para gestionarlas"
- whatsapp-setup: WhatsApp Business Setup — "Estás perdiendo consultas porque no respondés por WhatsApp de manera profesional"
- web-new: Sitio Web Nuevo — "No tenés presencia web — estás perdiendo a todos los clientes que buscan online"
- web-redesign: Rediseño Web — "Tu sitio actual transmite que la empresa está desactualizada"
- landing-page: Landing Page de Conversión — "Tu sitio no convierte visitas en consultas ni clientes"
- seo-technical: SEO Técnico — "Google tiene dificultades para rastrear e indexar tu sitio correctamente"
- seo-schema: SEO Schema (Datos Estructurados) — "Tu sitio no aparece con resultados enriquecidos en Google (estrellitas, precios, FAQ)"
- hostingguard: HostingGuard — "Tu sitio tiene vulnerabilidades de seguridad que afectan la confianza de tus clientes"
- meta-ads: Meta Ads (Facebook + Instagram) — "No estás alcanzando a tu audiencia objetivo con publicidad en Meta"
- email-automation: Email Marketing y Automatización — "Perdés clientes que ya compraron porque no mantenés el contacto de forma sistemática"
- booking-automation: Sistema de Turnos Online — "Perdés consultas porque no podés tomar turnos las 24 horas de forma automática"
- lead-capture: Captura de Leads (Formulario + CRM) — "Tenés visitas web pero no sabés quiénes son — sin un sistema de captura, esos contactos se pierden"

REGLAS CRÍTICAS para los scores:
1. auditScore = calidad técnica actual del sitio (0=terrible, 100=excelente). Evalúa el estado actual.
2. commercialOpportunityScore = cuánto puede vender Inspyra a esta empresa (0-100). INDEPENDIENTE del auditScore.
   - Un sitio EXCELENTE puede tener commercial score ALTO porque necesita SEO, Ads, Social Media o Automatización.
   - Un sitio MALO puede tener commercial score BAJO si la empresa no tiene presupuesto o no es el público objetivo.
   - NUNCA asumas que auditScore alto = commercial score bajo. Son dimensiones completamente diferentes.
3. serviceFits = score de oportunidad de venta por servicio (0-100 cada uno). Usa el rubro detectado para priorizar.
   Ejemplos de señales: sin website → web-new=90; sin GBP visible → gbp-management=80; headers de seguridad ausentes → hostingguard=75.

Devuelve ÚNICAMENTE este JSON (sin markdown):
{
  "empresa": "nombre detectado",
  "dominio": "${dominio}",
  "rubroEstimado": "industria",
  "auditScore": <0-100, calidad técnica del sitio>,
  "commercialOpportunityScore": <0-100, oportunidad de venta total, independiente del auditScore>,
  "erroresVisibles": [],
  "hallazgos": {
    "seo":          { "score": 0, "issues": [] },
    "frontend":     { "score": 0, "issues": [] },
    "performance":  { "score": 0, "issues": [] },
    "seguridad":    { "score": 0, "issues": [] },
    "arquitectura": { "stack": [], "cms": null, "issues": [] }
  },
  "severidad": { "critico": [], "alto": [], "medio": [], "bajo": [] },
  "serviciosSugeridos": ["usar nombres del catálogo (no IDs), 2-4 servicios con evidencia real"],
  "serviceFits": {
    "gbp-management": <0-100>,
    "seo-local": <0-100>,
    "review-management": <0-100>,
    "social-management": <0-100>,
    "crm-setup": <0-100>,
    "whatsapp-setup": <0-100>,
    "web-new": <0-100>,
    "web-redesign": <0-100>,
    "landing-page": <0-100>,
    "seo-technical": <0-100>,
    "seo-schema": <0-100>,
    "hostingguard": <0-100>,
    "meta-ads": <0-100>,
    "email-automation": <0-100>,
    "booking-automation": <0-100>,
    "lead-capture": <0-100>
  },
  "outreachBrief": "2-3 oraciones del problema principal y la oportunidad de negocio para Inspyra"
}`;

    const output = await this.spawnClaude(prompt, 'claude-sonnet-4-6', 120_000);
    const match = output.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Audit no devolvió JSON para ${dominio}`);

    const result = JSON.parse(match[0]) as WebsiteAuditResult;
    result.dominio = dominio;
    return result;
  }

  // ── Phase 4: Campaign Fit ──────────────────────────────────────────────────
  // ERP-045A: Service fit is METADATA only — never a discard criterion.
  // The only gate is: commercialOpportunityScore >= effectiveThreshold.
  // BROAD mode activates when campaign.threshold <= 40 (effectiveThreshold -= 20).

  private evaluateCampaignFit(
    audit: WebsiteAuditResult,
    campaign: DiscoveryCampaign,
  ): { fits: boolean; reason: string } {
    const score = audit.commercialOpportunityScore;
    const isBroadMode = campaign.threshold <= 40;
    const effectiveThreshold = isBroadMode ? Math.max(0, campaign.threshold - 20) : campaign.threshold;

    if (score < effectiveThreshold) {
      const mode = isBroadMode ? ` (broad mode, effective threshold: ${effectiveThreshold})` : '';
      return { fits: false, reason: `Score ${score} < threshold ${campaign.threshold}${mode}` };
    }

    const mode = isBroadMode ? ' [BROAD]' : '';
    return { fits: true, reason: `Score ${score} ≥ ${effectiveThreshold}${mode}` };
  }

  // ── Phase 5a: Create prospect in INVESTIGADO ───────────────────────────────

  private async createProspectFromAudit(
    tenantId: string,
    company: RawCompany,
    audit: WebsiteAuditResult,
    campaign: DiscoveryCampaign,
  ) {
    const score = audit.commercialOpportunityScore;
    const nivel = score >= 90 ? 'CRITICA' : score >= 75 ? 'ALTA' : score >= 60 ? 'MEDIA' : 'BAJA';
    const prioridad = score >= 80 ? 'ALTA' : score >= 65 ? 'MEDIA' : 'BAJA';

    return this.prisma.prospect.create({
      data: {
        tenantId,
        nombreEmpresa:       audit.empresa || company.nombreEmpresa,
        ciudad:              company.ciudad,
        pais:                company.pais,
        rubro:               audit.rubroEstimado || company.rubro,
        website:             company.website,
        instagram:           company.instagram,
        linkedin:            company.linkedin,
        empleadosEstimado:   company.empleadosEstimado,
        oportunidadDetectada: audit.outreachBrief,
        problemasEncontrados: audit.erroresVisibles,
        nivelOportunidad:    nivel as never,
        servicioSugerido:    this.bestServiceFit(audit, campaign),
        score,
        prioridad:           prioridad as never,
        fuente:              'MANUAL',
        detectadoPor:        'IA',
        estado:              'INVESTIGADO',
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  // Maps SIR serviceId → display name for prospect.servicioSugerido
  private static readonly SERVICE_FIT_LABELS: Record<string, string> = {
    // SIR slugs (current)
    'gbp-management':    'Gestión de Google Business Profile',
    'seo-local':         'SEO Local',
    'review-management': 'Gestión de Reseñas',
    'social-management': 'Gestión de Redes Sociales',
    'crm-setup':         'Setup CRM',
    'whatsapp-setup':    'WhatsApp Business Setup',
    'web-new':           'Sitio Web Nuevo',
    'web-redesign':      'Rediseño Web',
    'landing-page':      'Landing Page de Conversión',
    'seo-technical':     'SEO Técnico',
    'seo-schema':        'SEO Schema (Datos Estructurados)',
    'hostingguard':      'HostingGuard',
    'meta-ads':          'Meta Ads (Facebook + Instagram)',
    'email-automation':  'Email Marketing y Automatización',
    'booking-automation':'Sistema de Turnos Online',
    'lead-capture':      'Captura de Leads (Formulario + CRM)',
    // Legacy keys (backward compat for scoreBreakdown stored before migration)
    seo:            'SEO Local',
    webDevelopment: 'Diseño Web',
    security:       'HostingGuard',
    performance:    'Performance Web',
    socialMedia:    'Gestión de Redes Sociales',
    maintenance:    'Mantenimiento WordPress',
    ads:            'Meta Ads (Facebook + Instagram)',
    automation:     'Sistema de Turnos Online',
  };

  private bestServiceFit(audit: WebsiteAuditResult, campaign: DiscoveryCampaign): string {
    // Prefer campaign services over general audit suggestions
    const campaignService = (campaign.servicesToSell as string[])[0];
    if (!audit.serviceFits) return campaignService ?? audit.serviciosSugeridos[0] ?? 'Consultoría Digital';

    // Pick the campaign service with the highest serviceFit score
    const campaignKey = (campaign.servicesToSell as string[])
      .map(s => {
        const key = Object.entries(CampaignsService.SERVICE_FIT_LABELS)
          .find(([, label]) => label.toLowerCase() === s.toLowerCase())?.[0];
        return key ? { key, score: audit.serviceFits![key as keyof typeof audit.serviceFits] ?? 0 } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)[0];

    if (campaignKey) {
      return CampaignsService.SERVICE_FIT_LABELS[campaignKey.key] ?? campaignService;
    }

    // Fall back to highest-scoring service overall
    const best = Object.entries(audit.serviceFits)
      .sort(([, a], [, b]) => b - a)[0];
    return best ? (CampaignsService.SERVICE_FIT_LABELS[best[0]] ?? campaignService) : campaignService;
  }

  // ── Phase 5b: AgentMetric upsert ──────────────────────────────────────────

  private async upsertDiscoveryMetrics(
    tenantId: string,
    campaignId: string,
    stats: {
      candidates: number; duplicates: number; noWebsite: number;
      auditFailed: number; scoreBelow: number; audited: number; promoted: number;
    },
  ) {
    const period = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const agentId = `discovery-${campaignId}`;

    const metrics = [
      { metricName: 'candidates_found',    value: stats.candidates },
      { metricName: 'duplicates_skipped',  value: stats.duplicates },
      { metricName: 'no_website_skipped',  value: stats.noWebsite },
      { metricName: 'audit_failed',        value: stats.auditFailed },
      { metricName: 'score_below',         value: stats.scoreBelow },
      { metricName: 'sites_audited',       value: stats.audited },
      { metricName: 'prospects_promoted',  value: stats.promoted },
      { metricName: 'conversion_rate',     value: stats.audited > 0 ? stats.promoted / stats.audited : 0 },
    ];

    await Promise.all(
      metrics.map(m =>
        this.prisma.agentMetric.upsert({
          where: { tenantId_agentId_metricName_period: { tenantId, agentId, metricName: m.metricName, period } },
          create: { tenantId, agentId, metricName: m.metricName, metricValue: m.value, period },
          update: { metricValue: { increment: m.value } },
        }),
      ),
    );
  }

  private async updateJobOutput(jobId: string, msg: string) {
    await this.prisma.researchJob.update({ where: { id: jobId }, data: { agentOutput: msg } });
  }

  private toSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  private stripUndefined<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== undefined),
    ) as Partial<T>;
  }

  private spawnClaude(prompt: string, model: string, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = [
        '-p', '-',
        '--output-format', 'text',
        '--dangerously-skip-permissions',
        '--model', model,
      ];
      this.logger.log(`Spawning claude | model: ${model}`);

      const child = spawn('claude', args, {
        cwd: this.projectRoot,
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      child.stdin.write(prompt, 'utf8');
      child.stdin.end();

      let stdout = '';
      let stderr = '';
      let settled = false;

      const done = (err?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (err) reject(err);
        else resolve(stdout);
      };

      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        done(new Error(`Timeout ${model} after ${timeoutMs / 60000}min`));
      }, timeoutMs);

      child.stdout.on('data', (c: Buffer) => { stdout += c.toString(); });
      child.stderr.on('data', (c: Buffer) => { stderr += c.toString(); });
      child.on('close', code => {
        if (code === 0) done();
        else done(new Error(`claude exited ${code}. stderr: ${stderr.slice(-400)}`));
      });
      child.on('error', done);
    });
  }
}
