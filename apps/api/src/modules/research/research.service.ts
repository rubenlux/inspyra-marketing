import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateResearchJobDto } from './dto/create-research-job.dto';
import { spawn } from 'child_process';
import * as path from 'path';

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

  // ── Pipeline ─────────────────────────────────────────────────────────────────

  private async runPipeline(jobId: string, tenantId: string, query: string, limit: number) {
    await this.prisma.researchJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    this.logger.log(`[Job ${jobId}] Pipeline start | "${query}" | limit: ${limit}`);

    try {
      // ── Phase 1: Haiku discovers companies ──────────────────────────────────
      await this.updateJobOutput(jobId, `[Fase 1/3] Haiku descubriendo ${limit} empresas…`);

      const rawCompanies = await this.discoverWithHaiku(query, limit);
      this.logger.log(`[Job ${jobId}] Phase 1 done — ${rawCompanies.length} companies`);

      // ── Save all candidates as DISCOVERED ───────────────────────────────────
      await this.updateJobOutput(jobId, `[Fase 2/3] Guardando ${rawCompanies.length} candidatos…`);

      const savedCandidates = await this.saveCandidates(jobId, tenantId, rawCompanies);
      await this.prisma.researchJob.update({
        where: { id: jobId },
        data: { candidatesFound: rawCompanies.length },
      });

      // ── Phase 2: Sonnet evaluates (JSON, no MCP) ────────────────────────────
      await this.updateJobOutput(jobId,
        `[Fase 2/3] Haiku trajo ${rawCompanies.length} empresas. Sonnet evaluando…`,
      );

      const evaluations = await this.evaluateWithSonnet(rawCompanies);
      this.logger.log(`[Job ${jobId}] Phase 2 done — ${evaluations.length} evaluations`);

      // ── Phase 3: Create prospects for qualified candidates ──────────────────
      await this.updateJobOutput(jobId,
        `[Fase 3/3] Creando prospectos para los que califican…`,
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
          const prospect = await this.createProspectFromEvaluation(
            tenantId, rawCompanies[evaluation.index], evaluation,
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
          agentOutput: `Haiku: ${rawCompanies.length} empresas descubiertas | Sonnet: ${prospectsFound} promovidas a prospecto, ${rawCompanies.length - prospectsFound} descartadas`,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[Job ${jobId}] Failed: ${msg}`);
      await this.prisma.researchJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', completedAt: new Date(), errorMessage: msg.slice(0, 1000) },
      });
    }
  }

  // ── Phase 1: Haiku Discovery ──────────────────────────────────────────────────

  private async discoverWithHaiku(query: string, limit: number): Promise<RawCompany[]> {
    const prompt = `Generá un JSON array con ${limit} empresas que coincidan con: "${query}"

Datos ricos y realistas para cada empresa. SOLO JSON, sin texto adicional:
[
  {
    "nombreEmpresa": "Bodega Clos de los Siete",
    "ciudad": "Mendoza", "provincia": "Mendoza", "pais": "Argentina",
    "rubro": "Bodega / Vino de alta gama",
    "website": "closdelossiete.com", "instagram": "@closdelossiete", "linkedin": "linkedin.com/company/clos-de-los-siete",
    "descripcion": "Bodega boutique fundada en 2002, produce Malbec y Cabernet. Exporta a Europa y EEUU. Venta directa al consumidor poco desarrollada.",
    "empleadosEstimado": 25, "añosFundacion": "2002",
    "presenciaDigital": { "tieneWeb": true, "tieneSeo": false, "tieneRedes": true, "tieneEcommerce": false, "tieneAgendaOnline": false },
    "facturacionEstimada": "mediana"
  }
]

Generá los ${limit} registros con variedad de tamaños y situaciones digitales. SOLO JSON.`;

    const output = await this.spawnClaudeText(prompt, 'claude-haiku-4-5-20251001', 3 * 60 * 1000);

    const match = output.match(/\[[\s\S]*\]/);
    if (!match) throw new Error(`Haiku no devolvió JSON válido. Output: ${output.slice(0, 300)}`);

    const parsed = JSON.parse(match[0]) as RawCompany[];
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Haiku devolvió JSON vacío');
    return parsed;
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

  // ── Phase 2: Sonnet Evaluation (JSON output, no MCP) ──────────────────────────

  private async evaluateWithSonnet(companies: RawCompany[]): Promise<SonnetEvaluation[]> {
    const prompt = `Sos el Senior Analyst de Inspyra Digital, agencia de marketing digital para pymes latinoamericanas (web, SEO local, redes sociales, publicidad digital, ecommerce, agendas online).

Tu ÚNICA tarea: evaluar estas ${companies.length} empresas y devolver un JSON array. NO uses herramientas. SOLO JSON como respuesta.

CRITERIOS DE SCORE (0-100):
  +35 — Sin ecommerce/tienda online (necesitan plataforma de venta)
  +25 — Sin SEO (oportunidad de posicionamiento local/orgánico)
  +20 — Sin agenda online (restaurantes, clínicas, estudios, peluquerías)
  +15 — Sin web propia o web muy desactualizada
  +15 — Sin redes activas o presencia social muy débil
  +10 — Rubro con alta demanda Inspyra (gastronomía, salud, legal, inmobiliaria, turismo)
  -20 — Empresa grande con equipo de marketing interno
  -15 — Microempresa familiar sin presupuesto probable (menos de 3 empleados, facturación pequeña)
  -10 — Ya bien posicionada digitalmente (tiene todo)

PROMOTE si score >= 60 — crear prospecto en CRM
DISCARD si score < 60 — descartar

EMPRESAS:
${JSON.stringify(companies, null, 2)}

FORMATO DE RESPUESTA (SOLO este JSON array, sin ningún texto adicional antes o después):
[
  {
    "index": 0,
    "nombreEmpresa": "nombre exacto de la empresa",
    "action": "PROMOTE",
    "score": 75,
    "scoreBreakdown": {"sinEcommerce": 35, "sinSeo": 25, "sinAgenda": 0, "sinWeb": 15, "sinRedes": 0, "bonusRubro": 10, "penalizaciones": 0},
    "reasoning": "Análisis de 2-3 oraciones explicando por qué es o no buen prospecto.",
    "problemasDetectados": ["Sin canal de venta directa online", "Nulo SEO local"],
    "oportunidadDetectada": "Descripción concreta de qué puede hacer Inspyra por esta empresa.",
    "servicioSugerido": "Web + Ecommerce",
    "estimatedTicketUsd": 800
  },
  {
    "index": 1,
    "nombreEmpresa": "nombre exacto",
    "action": "DISCARD",
    "score": 20,
    "scoreBreakdown": {"sinEcommerce": 0, "sinSeo": 0, "penalizaciones": -20},
    "reasoning": "Por qué no es buen prospecto.",
    "discardReason": "Empresa grande con marketing interno"
  }
]

Evaluá las ${companies.length} empresas. SOLO el JSON array como respuesta.`;

    const output = await this.spawnClaudeText(prompt, 'claude-sonnet-4-6', 5 * 60 * 1000);

    const match = output.match(/\[[\s\S]*\]/);
    if (!match) {
      this.logger.warn(`Sonnet output (first 500): ${output.slice(0, 500)}`);
      throw new Error(`Sonnet no devolvió JSON válido`);
    }

    try {
      const parsed = JSON.parse(match[0]) as SonnetEvaluation[];
      if (!Array.isArray(parsed)) throw new Error('Sonnet devolvió JSON no-array');
      return parsed;
    } catch (e) {
      throw new Error(`Error parseando evaluaciones de Sonnet: ${e.message}`);
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

  private async updateJobOutput(jobId: string, msg: string) {
    await this.prisma.researchJob.update({ where: { id: jobId }, data: { agentOutput: msg } });
  }

  // ── Claude spawn (text only, no MCP) ─────────────────────────────────────────

  private spawnClaudeText(prompt: string, model: string, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = ['-p', prompt, '--output-format', 'text', '--dangerously-skip-permissions', '--model', model];
      this.logger.log(`Spawning claude | model: ${model}`);

      const child = spawn('claude', args, {
        cwd: this.projectRoot,
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

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
