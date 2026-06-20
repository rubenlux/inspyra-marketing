import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateResearchJobDto } from './dto/create-research-job.dto';
import { spawn } from 'child_process';
import * as path from 'path';

// ── Types ──────────────────────────────────────────────────────────────────────

export class DiscoveryInfrastructureError extends Error {
  constructor(
    public readonly code: 'API_BUDGET_EXCEEDED' | 'WEBSEARCH_TIMEOUT' | 'MCP_UNAVAILABLE' | 'INVALID_JSON' | 'UNKNOWN',
    message: string,
    public readonly rawOutput?: string
  ) {
    super(`[${code}] ${message}`);
    this.name = 'DiscoveryInfrastructureError';
  }
}

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
  presenciaDigital?: {
    tieneWeb?: boolean;
    tieneSeo?: boolean;
    tieneRedes?: boolean;
    tieneEcommerce?: boolean;
    tieneAgendaOnline?: boolean;
  };
  facturacionEstimada?: string;
}

interface SonnetEvaluation {
  index: number;
  nombreEmpresa: string;
  action: 'PROMOTE' | 'DISCARD';
  score: number;
  scoreBreakdown?: Record<string, number>;
  reasoning?: string;
  discardReason?: string;
  problemasDetectados?: string[];
  oportunidadDetectada?: string;
  servicioSugerido?: string;
  estimatedTicketUsd?: number;
  evidence?: {
    website?: string | null;
    googleBusiness?: string | null;
    linkedin?: string | null;
    facebook?: string | null;
    instagram?: string | null;
  };
}

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
  // SIR-based opportunity scores — keyed by SIR serviceId (0-100 each)
  serviceFits?: Record<string, number>;
  outreachBrief: string;
}

// ── Service ────────────────────────────────────────────────────────────────────

@Injectable()
export class ResearchService {
  private readonly logger = new Logger(ResearchService.name);
  private readonly projectRoot = path.resolve(__dirname, '../../../../../');

  constructor(private readonly prisma: PrismaService) {}

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
      // Capture security-relevant response headers
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

    const prompt = `Eres el Website Audit Agent de Inspyra, una agencia digital argentina.

CATÁLOGO DE SERVICIOS (usar estos nombres exactos en serviciosSugeridos):
- Gestión de Google Business Profile — "Tus clientes no te encuentran en Google Maps cuando buscan tu rubro en la zona"
- SEO Local — "Tu negocio no aparece cuando alguien busca tu rubro en tu ciudad"
- Gestión de Reseñas — "Las reseñas online son el primer filtro que usan tus clientes para elegir"
- Gestión de Redes Sociales — "Tu competencia capta clientes en Instagram todos los días — vos no tenés presencia activa"
- Setup CRM — "Estás perdiendo oportunidades de venta porque no tenés un sistema para gestionarlas"
- WhatsApp Business Setup — "Estás perdiendo consultas porque no respondés por WhatsApp de manera profesional"
- Sitio Web Nuevo — "No tenés presencia web — estás perdiendo a todos los clientes que buscan online"
- Rediseño Web — "Tu sitio actual transmite que la empresa está desactualizada"
- Landing Page de Conversión — "Tu sitio no convierte visitas en consultas ni clientes"
- SEO Técnico — "Google tiene dificultades para rastrear e indexar tu sitio correctamente"
- SEO Schema (Datos Estructurados) — "Tu sitio no aparece con resultados enriquecidos en Google (estrellitas, precios, FAQ)"
- HostingGuard — "Tu sitio tiene vulnerabilidades de seguridad que afectan la confianza de tus clientes"
- Meta Ads (Facebook + Instagram) — "No estás alcanzando a tu audiencia objetivo con publicidad en Meta"
- Email Marketing y Automatización — "Perdés clientes que ya compraron porque no mantenés el contacto de forma sistemática"
- Sistema de Turnos Online — "Perdés consultas porque no podés tomar turnos las 24 horas de forma automática"
- Captura de Leads (Formulario + CRM) — "Tenés visitas web pero no sabés quiénes son — sin un sistema de captura, esos contactos se pierden"

Auditá el sitio en 5 capas y detectá oportunidades comerciales REALES para vender esos servicios.

URL: ${normalizedUrl}

=== HEADERS HTTP ===
${headersText}

=== HTML (scripts/estilos removidos) ===
${html}

CAPA 1 — SEO: title, meta description, meta keywords, Open Graph, Twitter Cards, Schema.org/structured data, canonical, robots meta, H1-H6 hierarchy, alt en imágenes, URL structure, sitemap hints.
CAPA 2 — FRONTEND: dependencias obsoletas detectables en el HTML (jQuery legacy, Bootstrap 3/4, AngularJS, Tether, Moment.js), errores JS visibles (onerror, .catch, error boundaries en HTML), assets potencialmente rotos, formularios sin validación, viewport meta, lang attribute, accesibilidad básica (ARIA, labels).
CAPA 3 — PERFORMANCE: scripts síncronos que bloquean render (sin defer/async), fonts de terceros bloqueantes, imágenes sin lazy loading o sin dimensiones, estimación de peso por cantidad de recursos en el HEAD, señales de CDN vs servidor propio, LCP/CLS estimados observables.
CAPA 4 — ARQUITECTURA: CMS detectado (patrones wp-content/wp-json=WordPress, generator meta=versión, Joomla, Drupal, Wix/Squarespace/Webflow/Shopify markers), framework frontend (__NEXT_DATA__=Next.js, ng-version=Angular, data-reactroot=React, etc.), server-side tech visible, hosting signals desde headers (Server, Via, CF-Ray=Cloudflare, X-Powered-By), versiones detectables y antigüedad.
CAPA 5 — SEGURIDAD: analiza los headers HTTP provistos. HTTPS activo, HSTS presente/ausente, CSP presente/ausente, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. Contenido mixto en HTML. Formularios sin protección CSRF visible.

Devuelve ÚNICAMENTE el siguiente JSON (sin markdown, sin texto extra):
{
  "empresa": "nombre detectado del HTML",
  "dominio": "${dominio}",
  "rubroEstimado": "industria estimada",
  "auditScore": <0-100: calidad técnica global>,
  "commercialOpportunityScore": <0-100: qué buena oportunidad es para Inspyra>,
  "erroresVisibles": ["problema grave o visible 1", "..."],
  "hallazgos": {
    "seo":          { "score": <0-100>, "issues": ["issue específico 1", "..."] },
    "frontend":     { "score": <0-100>, "issues": ["jQuery 1.x legacy detectado", "..."] },
    "performance":  { "score": <0-100>, "issues": ["4 scripts síncronos en HEAD", "..."] },
    "seguridad":    { "score": <0-100>, "issues": ["CSP ausente", "HSTS ausente", "..."] },
    "arquitectura": { "stack": ["WordPress", "PHP", "Cloudflare"], "cms": "WordPress", "issues": ["versión no detectable — riesgo de plugin obsoleto"] }
  },
  "severidad": {
    "critico": ["problemas que rompen el sitio o son críticos para negocio"],
    "alto":    ["problemas importantes con impacto medible en tráfico/conversión"],
    "medio":   ["mejoras notables pero no urgentes"],
    "bajo":    ["detalles menores o cosméticos"]
  },
  "serviciosSugeridos": ["Solo servicios del catálogo que correspondan por evidencia real, 2-4 max"],
  "outreachBrief": "2-3 oraciones concretas: qué problema tiene, qué pierde por eso, qué puede resolver Inspyra"
}

Scoring:
- commercialOpportunityScore 75-100: sitio desactualizado/roto, empresa real activa con presupuesto presumible
- commercialOpportunityScore 40-74: sitio básico con mejoras posibles
- commercialOpportunityScore 0-39: sitio profesional moderno o empresa muy grande sin necesidades obvias
- auditScore 0-30: múltiples capas críticas fallando
- auditScore 31-60: funcional pero con problemas importantes en 2+ capas
- auditScore 61-100: buena base técnica, problemas menores

IMPORTANTE: serviciosSugeridos debe reflejar los problemas REALES encontrados en las 5 capas, no solo SEO.`;

    let raw: string;
    try {
      raw = await this.spawnClaudeText(prompt, 'claude-sonnet-4-6', 180 * 1000);
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

  // ── Pipeline ─────────────────────────────────────────────────────────────────

  private async runPipeline(jobId: string, tenantId: string, query: string, limit: number) {
    await this.prisma.researchJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    this.logger.log(`[Job ${jobId}] Pipeline start | "${query}" | limit: ${limit}`);

    try {
      // ── Phase 1: Real web search discovery ──────────────────────────────────
      await this.updateJobOutput(jobId, `[Fase 1/4] Buscando empresas reales: "${query}"…`);

      const { companies: rawCompanies, sinEvidencia: sinEvidenciaCount } = await this.discoverRealWithWebSearch(query, limit);
      this.logger.log(`[Job ${jobId}] [DISCOVERY] Phase 1 done — ${rawCompanies.length} con evidencia, ${sinEvidenciaCount} sin evidencia descartadas`);

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

      // ── Save all candidates as DISCOVERED ───────────────────────────────────
      await this.updateJobOutput(jobId, `[Fase 2/4] Guardando ${rawCompanies.length} candidatos verificados…`);

      const savedCandidates = await this.saveCandidates(jobId, tenantId, rawCompanies);
      await this.prisma.researchJob.update({
        where: { id: jobId },
        data: { candidatesFound: rawCompanies.length },
      });

      // ── Phase 2: Real evidence validation (HTTP) ────────────────────────────
      await this.updateJobOutput(jobId, `[Fase 2/4] Validando evidencia real de ${rawCompanies.length} empresas…`);

      const validatedIndices: number[] = [];
      const invalidatedIndices: number[] = [];

      for (let i = 0; i < rawCompanies.length; i++) {
        const c = rawCompanies[i];
        const evidenceResult = await this.validateEvidence(c);
        const candidate = savedCandidates[i];

        if (evidenceResult.valid) {
          validatedIndices.push(i);
          this.logger.log(`[Job ${jobId}] [EVIDENCE] ✓ ${c.nombreEmpresa} — ${evidenceResult.details}`);
        } else {
          invalidatedIndices.push(i);
          this.logger.log(`[Job ${jobId}] [EVIDENCE] ✗ ${c.nombreEmpresa} — ${evidenceResult.details}`);
          if (candidate) {
            await this.prisma.researchCandidate.update({
              where: { id: candidate.id },
              data: { status: 'DISCARDED', discardReason: `Evidencia no verificable: ${evidenceResult.details}` },
            });
          }
        }
      }

      this.logger.log(`[Job ${jobId}] [EVIDENCE] Gate: ${validatedIndices.length} verificadas, ${invalidatedIndices.length} invalidadas`);

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

      // ── Phase 3: Pre-filter → Sonnet on top 20 validated ────────────────────
      const validatedCompanies = validatedIndices.map(i => rawCompanies[i]);
      const selectedSubIndices = this.preSelectForSonnet(validatedCompanies, 20);
      const selectedIndices = selectedSubIndices.map(j => validatedIndices[j]);
      const selectedSet = new Set(selectedIndices);
      const preDiscardedIndices = validatedIndices.filter(i => !selectedSet.has(i));

      this.logger.log(`[Job ${jobId}] Pre-filter: ${selectedIndices.length} → Sonnet, ${preDiscardedIndices.length} → auto-discard`);

      await this.updateJobOutput(jobId,
        `[Fase 3/4] Evidencia: ${validatedIndices.length} verificadas. Evaluando ${selectedIndices.length} con Sonnet…`,
      );

      const sonnetBatch = selectedIndices.map(i => rawCompanies[i]);
      const sonnetEvaluations = await this.evaluateWithSonnet(sonnetBatch, selectedIndices);

      for (const ev of sonnetEvaluations) {
        this.logger.log(`[Job ${jobId}] [EVALUATION] ${rawCompanies[ev.index]?.nombreEmpresa} → ${ev.action} (score: ${ev.score})`);
      }

      const preDiscardEvaluations: SonnetEvaluation[] = preDiscardedIndices.map(i => ({
        index: i,
        nombreEmpresa: rawCompanies[i].nombreEmpresa,
        action: 'DISCARD',
        score: 0,
        discardReason: 'Pre-filtrado: score heurístico insuficiente',
      }));

      const evaluations = [...sonnetEvaluations, ...preDiscardEvaluations];
      this.logger.log(`[Job ${jobId}] Phase 3 done — ${sonnetEvaluations.length} Sonnet evals + ${preDiscardEvaluations.length} auto-discards`);

      // ── Phase 4: Create prospects for qualified candidates ──────────────────
      await this.updateJobOutput(jobId,
        `[Fase 4/4] Creando prospectos para los que califican…`,
      );

      let prospectsFound = 0;
      for (const evaluation of evaluations) {
        const candidate = savedCandidates[evaluation.index];
        if (!candidate) continue;

        const commonUpdate = {
          score: evaluation.score,
          scoreBreakdown: evaluation.scoreBreakdown ?? {},
          reasoning: evaluation.reasoning,
          discardReason: evaluation.discardReason,
          problemasDetectados: evaluation.problemasDetectados ?? [],
          oportunidadDetectada: evaluation.oportunidadDetectada,
          servicioSugerido: evaluation.servicioSugerido,
          estimatedTicketUsd: evaluation.estimatedTicketUsd,
        };

        if (evaluation.action === 'PROMOTE' && evaluation.score >= 60) {
          const company = rawCompanies[evaluation.index];
          const prospect = await this.createProspectFromEvaluation(
            tenantId, company, evaluation,
          );
          await this.prisma.researchCandidate.update({
            where: { id: candidate.id },
            data: { ...commonUpdate, status: 'PROMOTED', prospectId: prospect.id },
          });
          prospectsFound++;
        } else {
          await this.prisma.researchCandidate.update({
            where: { id: candidate.id },
            data: { ...commonUpdate, status: 'DISCARDED' },
          });
        }
      }

      this.logger.log(`[Job ${jobId}] Pipeline done — ${prospectsFound}/${rawCompanies.length} promoted`);

      await this.prisma.researchJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          prospectsFound,
          agentOutput: [
            `=== DISCOVERY REAL ===`,
            `Query: "${query}"`,
            `Encontradas: ${rawCompanies.length + sinEvidenciaCount}`,
            `Sin evidencia (descartadas en búsqueda): ${sinEvidenciaCount}`,
            `Con evidencia: ${rawCompanies.length}`,
            `Evidencia verificada (HTTP): ${validatedIndices.length}`,
            `Evidencia fallida: ${invalidatedIndices.length}`,
            `Enviadas a Sonnet: ${selectedIndices.length}`,
            `PROMOVIDAS a prospecto: ${prospectsFound}`,
            `Descartadas: ${rawCompanies.length - prospectsFound}`,
          ].join('\n'),
        },
      });
    } catch (err) {
      let statusStr = 'FAILED';
      let errorCategory = 'UNKNOWN_ERROR';
      let msg = err instanceof Error ? err.message : String(err);
      let rawOut = '';

      if (err instanceof DiscoveryInfrastructureError) {
        errorCategory = err.code;
        if (err.code === 'API_BUDGET_EXCEEDED') statusStr = 'RATE_LIMITED';
        else if (err.code === 'INVALID_JSON') statusStr = 'EVALUATION_FAILED';
        else statusStr = 'INFRASTRUCTURE_FAILED';
        rawOut = `\nRaw Provider Output:\n${err.rawOutput?.slice(0, 500) ?? 'N/A'}`;
      }

      this.logger.error(`[Job ${jobId}] Failed (${errorCategory}): ${msg}`);
      
      const finalMsg = `[${statusStr}] ${errorCategory} - ${msg}${rawOut}`;
      
      await this.prisma.researchJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', completedAt: new Date(), errorMessage: finalMsg.slice(0, 1000) },
      });
    }
  }

  // ── Phase 1: Real Web Search Discovery ────────────────────────────────────────

  private async discoverRealWithWebSearch(
    query: string,
    limit: number,
  ): Promise<{ companies: RawCompany[]; sinEvidencia: number }> {
    // Generate 3 diversified search queries to maximize coverage
    const queries = await this.generateSearchQueries(query, 3);
    this.logger.log(`[DISCOVERY] Queries (${queries.length}): ${queries.join(' | ')}`);

    const perQueryLimit = Math.ceil(limit / queries.length) * 3; // 3x overshoot, dedup later
    const results: RawCompany[] = [];
    let sinEvidencia = 0;

    for (const q of queries) {
      try {
        const { companies, sinEvidencia: querySinEvidencia } = await this.searchCompaniesForQuery(q, perQueryLimit);
        results.push(...companies);
        sinEvidencia += querySinEvidencia;
        this.logger.log(`[DISCOVERY] "${q}" → ${companies.length} con evidencia, ${querySinEvidencia} sin evidencia`);
      } catch (err) {
        this.logger.warn(`[DISCOVERY] Query "${q}" failed: ${(err as Error).message}`);
      }
    }

    // Intra-batch dedup by normalized domain
    const seenDomains = new Set<string>();
    const seenNames = new Set<string>();
    const unique = results.filter(c => {
      const nameKey = c.nombreEmpresa.toLowerCase().trim();
      if (seenNames.has(nameKey)) return false;
      seenNames.add(nameKey);

      if (c.website) {
        const domain = this.normalizeDomain(c.website);
        if (domain && seenDomains.has(domain)) return false;
        if (domain) seenDomains.add(domain);
      }
      return true;
    });

    this.logger.log(`[DISCOVERY] Total: ${results.length} raw → ${unique.length} unique (${results.length - unique.length} intra-batch dupes)`);
    return { companies: unique.slice(0, limit * 2), sinEvidencia };
  }

  private async generateSearchQueries(query: string, count: number): Promise<string[]> {
    const prompt = `Genera exactamente ${count} queries de búsqueda web DIVERSIFICADAS para encontrar empresas reales que coincidan con: "${query}"

Reglas ESTRICTAS:
- Las queries deben encontrar EMPRESAS, no filtrar por sus características digitales
- CORRECTO: "restaurantes mendoza", "bodegas premium argentina", "inmobiliarias capital federal"
- INCORRECTO: "restaurantes sin web", "bodegas con SEO malo"
- Variar geografía y ángulos entre queries
- Objetivo: MAXIMIZAR diversidad de empresas reales encontradas

Devuelve SOLO un JSON array de strings, sin markdown:
["query 1", "query 2", "query 3"]`;

    try {
      const output = await this.spawnClaudeText(prompt, 'claude-sonnet-4-6', 60_000);
      const match = output.match(/\[[\s\S]*?\]/);
      if (!match) {
        const lower = output.toLowerCase();
        let code: DiscoveryInfrastructureError['code'] = 'INVALID_JSON';
        if (/limit|exceeded|budget|quota/i.test(lower)) code = 'API_BUDGET_EXCEEDED';
        throw new DiscoveryInfrastructureError(code, "Fallo al generar subqueries.", output);
      }
      const parsed = JSON.parse(match[0]) as string[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed.slice(0, count) : [query];
    } catch (err) {
      if (err instanceof DiscoveryInfrastructureError) throw err;
      return [query];
    }
  }

  private async searchCompaniesForQuery(
    query: string,
    limit: number,
  ): Promise<{ companies: RawCompany[]; sinEvidencia: number }> {
    const prompt = `Usa web_search para buscar: "${query}"

Extraé de los resultados de búsqueda hasta ${limit} empresas REALES que hayan aparecido.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠ CONTRATO ANTI-ALUCINACIÓN — OBLIGATORIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. NO inventes empresas. NO generes nombres de ejemplo. NO infieras nombres.
2. SOLO incluí empresas que aparecieron EXPLÍCITAMENTE en los resultados de la búsqueda.
3. Cada empresa DEBE tener al menos UNO de: website, instagram, linkedin.
4. Si una empresa apareció pero no tenés ningún canal verificable → NO incluirla.
5. Si los resultados no contienen empresas reales → devolvé [] (array vacío).
6. NO incluyas directorios, listados, artículos, marketplaces — solo empresas individuales.

La respuesta debe contener únicamente un JSON array válido.
No incluir explicaciones. No incluir markdown. No incluir bloques \`\`\`json.

Formato exacto (null para campos que no encontraste):
[{
  "nombreEmpresa": "Nombre exacto como apareció en el resultado",
  "website": "https://sitio.com o null",
  "instagram": "https://instagram.com/... o null",
  "linkedin": "https://linkedin.com/... o null",
  "ciudad": "Ciudad",
  "pais": "País",
  "provincia": "Provincia o null",
  "rubro": "Sector/industria",
  "descripcion": "Qué hace la empresa (máx 1 oración)",
  "empleadosEstimado": null,
  "añosFundacion": null,
  "presenciaDigital": { "tieneWeb": true, "tieneSeo": false, "tieneRedes": false, "tieneEcommerce": false, "tieneAgendaOnline": false },
  "facturacionEstimada": null
}]`;

    const output = await this.spawnClaudeAgentic(prompt, 'claude-sonnet-4-6', 60_000, 180_000);

    let parsed: RawCompany[] = [];
    try {
      parsed = JSON.parse(output.trim()) as RawCompany[];
    } catch {
      const match = output.match(/\[[\s\S]*\]/);
      if (match) {
        try { parsed = JSON.parse(match[0]) as RawCompany[]; } catch { /* irreparable */ }
      }
    }

    if (!Array.isArray(parsed)) {
      const lower = output.toLowerCase();
      let code: DiscoveryInfrastructureError['code'] = 'UNKNOWN';
      if (/limit|exceeded|budget|quota/i.test(lower)) code = 'API_BUDGET_EXCEEDED';
      else if (/timeout/i.test(lower)) code = 'WEBSEARCH_TIMEOUT';
      else if (/mcp|tool/i.test(lower)) code = 'MCP_UNAVAILABLE';
      else code = 'INVALID_JSON';
      
      throw new DiscoveryInfrastructureError(code, "El agente falló en devolver entidades válidas", output);
    }

    const withEvidence = parsed.filter(
      c => c.nombreEmpresa && (c.website || c.instagram || c.linkedin),
    );
    const sinEvidencia = parsed.length - withEvidence.length;

    for (const c of withEvidence) {
      this.logger.log(`[DISCOVERY] Empresa encontrada: ${c.nombreEmpresa} | web: ${c.website ?? 'null'} | ig: ${c.instagram ?? 'null'} | li: ${c.linkedin ?? 'null'}`);
    }

    return { companies: withEvidence, sinEvidencia };
  }

  // ── Evidence Validation (Real HTTP) ────────────────────────────────────────────

  private async validateEvidence(company: RawCompany): Promise<{ valid: boolean; details: string }> {
    const checks: string[] = [];
    let anyValid = false;

    // Validate website
    if (company.website) {
      const url = company.website.startsWith('http') ? company.website : `https://${company.website}`;
      try {
        const res = await fetch(url, {
          method: 'HEAD',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InspyraBot/1.0)' },
          signal: AbortSignal.timeout(8000),
          redirect: 'follow',
        });
        if (res.ok || res.status === 403 || res.status === 405) {
          // 403/405 = server exists but blocks HEAD, still valid evidence
          checks.push(`website:${res.status}✓`);
          anyValid = true;
        } else {
          checks.push(`website:${res.status}✗`);
        }
      } catch (err) {
        checks.push(`website:unreachable(${(err as Error).message.slice(0, 30)})`);
      }
    }

    // Validate Instagram (HEAD check on profile URL)
    if (company.instagram) {
      const igUrl = company.instagram.startsWith('http')
        ? company.instagram
        : `https://instagram.com/${company.instagram.replace(/^@/, '')}`;
      try {
        const res = await fetch(igUrl, {
          method: 'HEAD',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InspyraBot/1.0)' },
          signal: AbortSignal.timeout(8000),
          redirect: 'follow',
        });
        // Instagram returns 200 for existing profiles, 404 for non-existent
        if (res.ok) {
          checks.push('instagram:✓');
          anyValid = true;
        } else {
          checks.push(`instagram:${res.status}✗`);
        }
      } catch {
        checks.push('instagram:unreachable');
      }
    }

    // Validate LinkedIn
    if (company.linkedin) {
      const liUrl = company.linkedin.startsWith('http')
        ? company.linkedin
        : `https://${company.linkedin}`;
      try {
        const res = await fetch(liUrl, {
          method: 'HEAD',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InspyraBot/1.0)' },
          signal: AbortSignal.timeout(8000),
          redirect: 'follow',
        });
        if (res.ok || res.status === 999) {
          // LinkedIn returns 999 for bot detection, but the profile exists
          checks.push('linkedin:✓');
          anyValid = true;
        } else {
          checks.push(`linkedin:${res.status}✗`);
        }
      } catch {
        checks.push('linkedin:unreachable');
      }
    }

    const details = checks.join(' | ') || 'Sin URLs para validar';
    return { valid: anyValid, details };
  }

  private normalizeDomain(urlOrDomain: string): string | null {
    try {
      const withScheme = urlOrDomain.startsWith('http') ? urlOrDomain : `https://${urlOrDomain}`;
      return new URL(withScheme).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      return null;
    }
  }

  // ── Save candidates (Phase 1 → DB) ───────────────────────────────────────────

  private async saveCandidates(jobId: string, tenantId: string, companies: RawCompany[]) {
    const created = await Promise.all(
      companies.map((c, i) =>
        this.prisma.researchCandidate.create({
          data: {
            jobId,
            tenantId,
            candidateIndex: i,
            nombreEmpresa: c.nombreEmpresa,
            ciudad: c.ciudad,
            pais: c.pais,
            rubro: c.rubro,
            website: c.website,
            instagram: c.instagram,
            linkedin: c.linkedin,
            descripcion: c.descripcion,
            empleadosEstimado: c.empleadosEstimado,
            anosFundacion: c.añosFundacion,
            presenciaDigital: c.presenciaDigital as object,
            facturacionEstimada: c.facturacionEstimada,
            status: 'DISCOVERED',
          },
        }),
      ),
    );
    return created; // indexed by position = candidateIndex
  }

  // ── Phase 2: Heuristic pre-selection ─────────────────────────────────────────

  private preSelectForSonnet(companies: RawCompany[], limit: number): number[] {
    if (companies.length <= limit) return companies.map((_, i) => i);

    const scored = companies.map((c, i) => {
      let score = 0;
      const pd = c.presenciaDigital ?? {};
      if (!pd.tieneSeo) score += 25;
      if (!pd.tieneEcommerce) score += 20;
      if (!pd.tieneAgendaOnline) score += 15;
      if (!pd.tieneWeb) score += 20;
      if (!pd.tieneRedes) score += 10;
      if ((c.empleadosEstimado ?? 10) < 3) score -= 15;
      return { score, index: i };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(x => x.index);
  }

  // ── Phase 2: Sonnet Evaluation (JSON output, no MCP) ──────────────────────────

  private async evaluateWithSonnet(companies: RawCompany[], originalIndices: number[]): Promise<SonnetEvaluation[]> {
    // URLs are passed for evidence validation only — Sonnet has --allowedTools none so cannot fetch them.
    const companiesForPrompt = companies.map((c, i) => ({
      _originalIndex: originalIndices[i],
      nombreEmpresa: c.nombreEmpresa,
      ciudad: c.ciudad,
      pais: c.pais,
      rubro: c.rubro,
      descripcion: c.descripcion,
      empleadosEstimado: c.empleadosEstimado,
      facturacionEstimada: c.facturacionEstimada,
      hasWebsite: !!c.website,
      hasInstagram: !!c.instagram,
      hasLinkedin: !!c.linkedin,
      hasSeo: c.presenciaDigital?.tieneSeo ?? false,
      hasEcommerce: c.presenciaDigital?.tieneEcommerce ?? false,
      hasOnlineAgenda: c.presenciaDigital?.tieneAgendaOnline ?? false,
      evidence: {
        website: c.website ?? null,
        linkedin: c.linkedin ?? null,
        instagram: c.instagram ?? null,
      },
    }));

    const prompt = `Sos el Senior Analyst de Inspyra Digital, agencia de marketing digital para pymes latinoamericanas (web, SEO local, redes sociales, publicidad digital, ecommerce, agendas online).

Tu ÚNICA tarea: evaluar estas ${companies.length} empresas usando ÚNICAMENTE los datos provistos. No busques información externa. Solo razonamiento sobre los campos del JSON.

SEÑALES DE PRESENCIA DIGITAL (ya calculadas por el sistema):
  hasWebsite / hasInstagram / hasLinkedin / hasSeo / hasEcommerce / hasOnlineAgenda = true/false

CRITERIOS DE SCORE — suma estricta, sin redondear, sin capear en 100:
  +30 — hasEcommerce: false (necesitan tienda online)
  +22 — hasSeo: false (oportunidad SEO local/orgánico)
  +17 — hasOnlineAgenda: false (aplica a gastronomía, salud, legal, servicios)
  +12 — hasWebsite: false (sin presencia web)
  +13 — hasInstagram: false y hasLinkedin: false (sin redes activas)
  +6  — Rubro con alta demanda Inspyra (gastronomía, salud, legal, inmobiliaria, turismo)
  -20 — Empresa grande con equipo de marketing interno
  -15 — Microempresa sin presupuesto probable (empleadosEstimado < 3, facturacion pequeña)
  -10 — Ya bien posicionada (todos los has* = true)

La suma máxima teórica (todos los positivos) es 100. Calculá la suma exacta — no la redondees ni la capees. Cada empresa debe tener un score diferente si sus señales difieren.

PROMOTE si score >= 55. DISCARD si score < 55.

REGLA DE EVIDENCIA — NO NEGOCIABLE:
Si evidence.website, evidence.linkedin Y evidence.instagram son todos null → action DEBE ser "DISCARD", discardReason: "Sin evidencia verificable".
Una empresa sin ninguna URL verificable no puede entrar al CRM bajo ningún concepto.

EMPRESAS:
${JSON.stringify(companiesForPrompt, null, 2)}

REGLAS DE TEXTO — MUY IMPORTANTES:
  - reasoning: máximo 12 palabras. Sin puntos. Sin conectores.
  - oportunidadDetectada: máximo 12 palabras. Slug corto.
  - servicioSugerido: slug corto sin espacios innecesarios (ej: "Web+SEO", "SEO+Redes", "Web+Agenda")
  - problemasDetectados: array de slugs de 2-3 palabras (ej: ["Sin web", "Sin SEO"])
  - discardReason: slug de 3-5 palabras

FORMATO DE RESPUESTA (SOLO este JSON array, sin texto adicional):
[
  {
    "index": <_originalIndex de la empresa>,
    "nombreEmpresa": "nombre exacto",
    "action": "PROMOTE",
    "score": 71,
    "scoreBreakdown": {"sinEcommerce": 30, "sinSeo": 22, "sinAgenda": 0, "sinWeb": 0, "sinRedes": 13, "bonusRubro": 6, "penalizaciones": 0},
    "reasoning": "Sin web, sin SEO, sin redes. Alto potencial.",
    "problemasDetectados": ["Sin web", "Sin SEO"],
    "oportunidadDetectada": "Web + SEO local para captar clientes nuevos.",
    "servicioSugerido": "Web+SEO",
    "estimatedTicketUsd": 2100,
    "evidence": {"website": "estudio-xyz.com.ar", "googleBusiness": null, "linkedin": null, "facebook": null, "instagram": null}
  },
  {
    "index": <_originalIndex>,
    "nombreEmpresa": "nombre exacto",
    "action": "DISCARD",
    "score": 20,
    "scoreBreakdown": {"penalizaciones": -20},
    "reasoning": "Empresa grande con marketing interno.",
    "discardReason": "Marketing interno",
    "evidence": {"website": null, "googleBusiness": null, "linkedin": null, "facebook": null, "instagram": null}
  }
]

Evalúa las ${companies.length} empresas. SOLO el JSON array.`;

    // Pass allowedTools='none' — 'none' is not a real tool name, so Claude gets an empty effective tool list.
    // Empty string '' was silently filtered out by the CLI parser, leaving all tools available.
    const output = await this.spawnClaudeText(prompt, 'claude-sonnet-4-6', 5 * 60 * 1000, 'none');

    const match = output.match(/\[[\s\S]*\]/);
    if (!match) {
      const lower = output.toLowerCase();
      let code: DiscoveryInfrastructureError['code'] = 'INVALID_JSON';
      if (/limit|exceeded|budget|quota/i.test(lower)) code = 'API_BUDGET_EXCEEDED';
      else if (/timeout/i.test(lower)) code = 'WEBSEARCH_TIMEOUT';
      
      this.logger.warn(`[Sonnet ERROR] ${output.slice(0, 500)}`);
      throw new DiscoveryInfrastructureError(code, 'Sonnet no devolvió output válido', output);
    }

    try {
      const parsed = JSON.parse(match[0]) as SonnetEvaluation[];
      if (!Array.isArray(parsed)) throw new Error('Sonnet devolvió JSON no-array');
      return parsed;
    } catch (e) {
      throw new Error(`Error parseando evaluaciones de Sonnet: ${(e as Error).message}`);
    }
  }

  // ── Phase 3: Create prospect via Prisma ──────────────────────────────────────

  private async createProspectFromEvaluation(
    tenantId: string,
    company: RawCompany,
    evaluation: SonnetEvaluation,
  ) {
    const nivel = this.scoreToNivel(evaluation.score);
    const prioridad = this.scoreToPrioridad(evaluation.score);
    const bvs = this.calculateBVS(company, evaluation.estimatedTicketUsd ?? 0);

    return this.prisma.prospect.create({
      data: {
        tenantId,
        nombreEmpresa: company.nombreEmpresa,
        ciudad: company.ciudad,
        pais: company.pais,
        rubro: company.rubro,
        website: company.website,
        instagram: company.instagram,
        linkedin: company.linkedin,
        empleadosEstimado: company.empleadosEstimado,
        oportunidadDetectada: evaluation.oportunidadDetectada,
        problemasEncontrados: evaluation.problemasDetectados ?? [],
        nivelOportunidad: nivel,
        servicioSugerido: evaluation.servicioSugerido,
        score: evaluation.score,
        commercialScore: bvs,
        prioridad,
        fuente: 'MANUAL',
        detectadoPor: 'IA',
        estado: 'NUEVO',
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  private scoreToNivel(score: number): 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA' {
    if (score >= 90) return 'CRITICA';
    if (score >= 75) return 'ALTA';
    if (score >= 60) return 'MEDIA';
    return 'BAJA';
  }

  private scoreToPrioridad(score: number): 'BAJA' | 'MEDIA' | 'ALTA' {
    if (score >= 80) return 'ALTA';
    if (score >= 65) return 'MEDIA';
    return 'BAJA';
  }

  // Business Value Score (0-20): purely algorithmic, no AI call.
  // Signals: ticket size (30%), company scale (40%), maturity (20%), sub-sector premium (10%).
  private calculateBVS(company: RawCompany, ticketUsd: number): number {
    // A. Ticket Potential (0-6 pts) — capped at 30% of max BVS
    let ticket = 0;
    if (ticketUsd >= 3000) ticket = 6;
    else if (ticketUsd >= 2500) ticket = 5;
    else if (ticketUsd >= 2000) ticket = 4;
    else if (ticketUsd >= 1500) ticket = 2;
    else if (ticketUsd >= 1000) ticket = 1;

    // B. Company Scale (0-8 pts) = billing (0-4) + employees (0-4)
    let billing = 0;
    const fac = (company.facturacionEstimada ?? '').toLowerCase();
    if (fac === 'grande') billing = 4;
    else if (fac === 'mediana') billing = 3;
    else if (fac === 'pequeña' || fac === 'pequena') billing = 1;

    const emp = company.empleadosEstimado ?? 0;
    let employees = 0;
    if (emp >= 10) employees = 4;
    else if (emp >= 7) employees = 3;
    else if (emp >= 5) employees = 2;
    else if (emp >= 3) employees = 1;

    // C. Company Maturity (0-4 pts) from founding year
    let maturity = 0;
    const foundedYear = parseInt(company.añosFundacion ?? '0', 10);
    if (foundedYear > 1900) {
      const yearsOld = new Date().getFullYear() - foundedYear;
      if (yearsOld >= 30) maturity = 4;
      else if (yearsOld >= 20) maturity = 3;
      else if (yearsOld >= 10) maturity = 2;
      else if (yearsOld >= 5) maturity = 1;
    }

    // D. Sub-sector Premium (0-2 pts)
    const rubro = (company.rubro ?? '').toLowerCase();
    let premium = 0;
    if (/lujo|premium|corporativo|internacional/.test(rubro)) premium = 2;
    else if (/multiservicio|comercial|empresarial/.test(rubro)) premium = 1;

    return Math.min(20, ticket + billing + employees + maturity + premium);
  }

  private async updateJobOutput(jobId: string, msg: string) {
    await this.prisma.researchJob.update({ where: { id: jobId }, data: { agentOutput: msg } });
  }

  // ── Claude spawn (text only, no MCP) ─────────────────────────────────────────

  // allowedTools: tool name to allow. Pass 'none' (non-existent tool) to disable all tools (pure reasoning mode).
  // --strict-mcp-config prevents global MCP servers (e.g. facebook-foro-informativo) from loading on every spawn.
  private spawnClaudeText(prompt: string, model: string, timeoutMs: number, allowedTools?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = ['-p', '-', '--output-format', 'text', '--dangerously-skip-permissions', '--strict-mcp-config', '--model', model];
      if (allowedTools !== undefined) args.push('--allowedTools', allowedTools);
      this.logger.log(`Spawning claude | model: ${model} | tools: ${allowedTools === 'none' ? 'none' : allowedTools ?? 'default'}`);

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

  // ── Claude spawn (agentic mode with WebSearch/WebFetch) ───────────────────────
  // Uses stream-json output to handle tool calls. Idle timeout kills stuck WebFetch.

  private spawnClaudeAgentic(
    prompt: string,
    model: string,
    idleTimeoutMs: number,
    totalTimeoutMs: number,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = [
        '-p', '-',
        '--output-format', 'stream-json',
        '--verbose',
        '--dangerously-skip-permissions',
        '--strict-mcp-config',
        '--model', model,
        '--allowedTools', 'WebFetch,WebSearch',
      ];
      this.logger.log(`Spawning claude agentic | model: ${model} | idle: ${idleTimeoutMs / 1000}s | total: ${totalTimeoutMs / 1000}s`);

      const child = spawn('claude', args, {
        cwd: this.projectRoot,
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      child.stdin.write(prompt, 'utf8');
      child.stdin.end();

      let stderr = '';
      let lineBuffer = '';
      let settled = false;

      const done = (err?: Error, result?: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(totalTimer);
        clearTimeout(idleTimer);
        if (err) reject(err);
        else resolve(result!);
      };

      const totalTimer = setTimeout(() => {
        child.kill('SIGTERM');
        done(new Error(`Timeout ${model} after ${totalTimeoutMs / 60000}min`));
      }, totalTimeoutMs);

      let idleTimer = setTimeout(() => {
        child.kill('SIGTERM');
        done(new Error(`Idle timeout ${model}: no output for ${idleTimeoutMs / 1000}s`));
      }, idleTimeoutMs);

      child.stdout.on('data', (chunk: Buffer) => {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          child.kill('SIGTERM');
          done(new Error(`Idle timeout ${model}: no output for ${idleTimeoutMs / 1000}s`));
        }, idleTimeoutMs);

        lineBuffer += chunk.toString();
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === 'result') {
              if (event.subtype === 'success') {
                done(undefined, event.result ?? '');
              } else {
                done(new Error(`claude result error: ${JSON.stringify(event).slice(0, 200)}`));
              }
            }
          } catch { /* partial or non-JSON line */ }
        }
      });

      child.stderr.on('data', (c: Buffer) => { stderr += c.toString(); });
      child.on('close', (code) => {
        if (settled) return;
        if (code === 0) done(new Error('claude closed without result event'));
        else done(new Error(`claude exited ${code}. stderr: ${stderr.slice(-400)}`));
      });
      child.on('error', done);
    });
  }
}
