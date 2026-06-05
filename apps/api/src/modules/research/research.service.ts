import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateResearchJobDto } from './dto/create-research-job.dto';
import { spawn } from 'child_process';
import * as path from 'path';

interface RawCompany {
  nombreEmpresa: string;
  ciudad: string;
  pais: string;
  provincia?: string;
  rubro: string;
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

@Injectable()
export class ResearchService {
  private readonly logger = new Logger(ResearchService.name);
  private readonly projectRoot = path.resolve(__dirname, '../../../../../');

  constructor(private readonly prisma: PrismaService) {}

  // ── Public API ──────────────────────────────────────────────────────────────

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

    setImmediate(() => {
      this.runPipeline(job.id, tenantId, dto.query, dto.limit ?? 50).catch(err =>
        this.logger.error(`[Job ${job.id}] Unhandled: ${err.message}`),
      );
    });

    return job;
  }

  async getJob(jobId: string, tenantId: string) {
    const job = await this.prisma.researchJob.findFirst({
      where: { id: jobId, tenantId },
    });
    if (!job) throw new NotFoundException(`Research job ${jobId} not found`);
    return job;
  }

  async listJobs(tenantId: string) {
    return this.prisma.researchJob.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true, query: true, status: true, prospectsFound: true,
        errorMessage: true, createdAt: true, startedAt: true, completedAt: true, limit: true,
      },
    });
  }

  // ── Pipeline ─────────────────────────────────────────────────────────────────

  private async runPipeline(jobId: string, tenantId: string, query: string, limit: number) {
    await this.prisma.researchJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    this.logger.log(`[Job ${jobId}] Starting pipeline | query: "${query}" | discovery: ${limit}`);

    try {
      // ── Phase 1: Haiku discovers companies ───────────────────────────────
      this.logger.log(`[Job ${jobId}] Phase 1 — Haiku discovery (${limit} companies)`);

      await this.prisma.researchJob.update({
        where: { id: jobId },
        data: { agentOutput: `[Fase 1] Haiku descubriendo ${limit} empresas…` },
      });

      const rawCompanies = await this.discoverWithHaiku(query, limit);

      this.logger.log(`[Job ${jobId}] Phase 1 complete — ${rawCompanies.length} companies discovered`);

      await this.prisma.researchJob.update({
        where: { id: jobId },
        data: { agentOutput: `[Fase 1 OK] ${rawCompanies.length} empresas descubiertas\n[Fase 2] Sonnet calificando y creando prospectos…` },
      });

      // ── Phase 2: Sonnet qualifies and creates prospects ──────────────────
      this.logger.log(`[Job ${jobId}] Phase 2 — Sonnet qualification & CRM creation`);

      const beforeCount = await this.prisma.prospect.count({ where: { tenantId } });

      await this.qualifyWithSonnet(jobId, rawCompanies);

      const afterCount = await this.prisma.prospect.count({ where: { tenantId } });
      const prospectsFound = Math.max(0, afterCount - beforeCount);

      this.logger.log(`[Job ${jobId}] Pipeline done — ${prospectsFound} prospects created from ${rawCompanies.length} evaluated`);

      await this.prisma.researchJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          prospectsFound,
          agentOutput: `[Fase 1] ${rawCompanies.length} empresas descubiertas por Haiku\n[Fase 2] ${prospectsFound} prospectos creados por Sonnet (de ${rawCompanies.length} evaluados)`,
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

  // ── Phase 1: Haiku Discovery ─────────────────────────────────────────────────

  private async discoverWithHaiku(query: string, limit: number): Promise<RawCompany[]> {
    const prompt = `Generá un JSON array con ${limit} empresas que coincidan con: "${query}"

Incluí datos ricos y realistas para cada empresa. Formato exacto (SOLO JSON, sin texto adicional):
[
  {
    "nombreEmpresa": "Bodega Clos de los Siete",
    "ciudad": "Mendoza",
    "provincia": "Mendoza",
    "pais": "Argentina",
    "rubro": "Bodega / Vino de alta gama",
    "website": "closdelossiete.com",
    "instagram": "@closdelossiete",
    "linkedin": "linkedin.com/company/clos-de-los-siete",
    "descripcion": "Bodega boutique fundada en 2002, produce Malbec y Cabernet. Exporta a Europa y EEUU. Venta directa al consumidor poco desarrollada. Sus vinos se venden principalmente a través de distribuidores.",
    "empleadosEstimado": 25,
    "añosFundacion": "2002",
    "presenciaDigital": {
      "tieneWeb": true,
      "tieneSeo": false,
      "tieneRedes": true,
      "tieneEcommerce": false,
      "tieneAgendaOnline": false
    },
    "facturacionEstimada": "mediana"
  }
]

Generá los ${limit} registros. Variá los tipos de empresas, tamaños y situaciones digitales. SOLO JSON.`;

    const output = await this.spawnClaudeText(prompt, 'claude-haiku-4-5-20251001', 3 * 60 * 1000);

    // Extract JSON array from output
    const match = output.match(/\[[\s\S]*\]/);
    if (!match) {
      this.logger.warn(`Haiku output (first 500): ${output.slice(0, 500)}`);
      throw new Error(`Haiku no devolvió JSON válido. Respuesta: ${output.slice(0, 200)}`);
    }

    try {
      const parsed = JSON.parse(match[0]) as RawCompany[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('JSON vacío o no es array');
      }
      return parsed;
    } catch (e) {
      throw new Error(`Error parseando JSON de Haiku: ${e.message}`);
    }
  }

  // ── Phase 2: Sonnet Qualification ────────────────────────────────────────────

  private async qualifyWithSonnet(jobId: string, companies: RawCompany[]): Promise<void> {
    const companiesJson = JSON.stringify(companies, null, 2);

    const prompt = `Sos el Senior Analyst de Inspyra Digital, una agencia de marketing digital especializada en pymes latinoamericanas. Servicios: web, SEO local, redes sociales, publicidad digital, plataformas de agenda/ecommerce.

El Research Agent te trae ${companies.length} fichas de empresas para que evalúes cuáles son prospectos reales para Inspyra.

══════════ DATOS CRUDOS DEL RESEARCH AGENT ══════════
${companiesJson}
══════════════════════════════════════════════════════

TU TAREA: Evaluá cada empresa y creá prospectos SOLO para las que califiquen.

CRITERIOS DE CALIFICACIÓN (score 0-100):
  +35 — Sin ecommerce/tienda online (necesitan plataforma)
  +25 — Sin SEO (oportunidad de posicionamiento)
  +20 — Sin agenda online (restaurantes, clínicas, estudios)
  +15 — Web desactualizada o sin web propia
  +15 — Sin redes activas o presencia muy débil
  -20 — Empresa grande con departamento de marketing propio
  -15 — Microempresa familiar sin presupuesto probable
  -10 — Ya bien posicionada digitalmente

CREAR prospecto si: score >= 60
DESCARTAR si: score < 60 (no llamar inspyra_create_prospect)

Para cada empresa que califique, llamá inspyra_create_prospect con:
  - problemasEncontrados: lista específica de 3-5 problemas reales basados en los datos
  - oportunidadDetectada: descripción concreta de qué puede hacer Inspyra (1-2 oraciones)
  - servicioSugerido: el servicio principal (ej: "SEO Local", "Web + Ecommerce", "Redes Sociales", "Plataforma de Turnos")
  - score: el número que calculaste
  - nivelOportunidad: BAJA/MEDIA/ALTA/CRITICA según el score
  - prioridad: BAJA/MEDIA/ALTA

Evaluá las ${companies.length} empresas. Sé crítico — solo creá las que realmente necesiten y puedan pagar los servicios de Inspyra. Empezá ahora.`;

    await this.spawnClaudeWithMcp(jobId, prompt, 'claude-sonnet-4-6', 5 * 60 * 1000);
  }

  // ── Spawn helpers ─────────────────────────────────────────────────────────────

  // Spawn claude without MCP — returns raw text output
  private spawnClaudeText(prompt: string, model: string, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = [
        '-p', prompt,
        '--output-format', 'text',
        '--dangerously-skip-permissions',
        '--model', model,
      ];

      this.logger.log(`Spawning claude text | model: ${model} | cwd: ${this.projectRoot}`);

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
        done(new Error(`Haiku timeout after ${timeoutMs / 60000} minutes`));
      }, timeoutMs);

      child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
      child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
      child.on('close', (code) => {
        if (code === 0) done();
        else done(new Error(`claude exited ${code}. stderr: ${stderr.slice(-500)}`));
      });
      child.on('error', (err) => done(err));
    });
  }

  // Spawn claude with MCP — Sonnet creates prospects
  private spawnClaudeWithMcp(jobId: string, prompt: string, model: string, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const mcpConfigPath = path.join(this.projectRoot, 'openclaw.json');

      const args = [
        '-p', prompt,
        '--mcp-config', mcpConfigPath,
        '--output-format', 'text',
        '--dangerously-skip-permissions',
        '--allowedTools', 'mcp__inspyra__*',
        '--model', model,
      ];

      this.logger.log(`[Job ${jobId}] Spawning claude+MCP | model: ${model}`);

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
        done(new Error(`Sonnet timeout after ${timeoutMs / 60000} minutes`));
      }, timeoutMs);

      child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
      child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
      child.on('close', (code) => {
        if (code === 0) done();
        else done(new Error(`claude exited ${code}. stderr: ${stderr.slice(-500)}`));
      });
      child.on('error', (err) => done(err));
    });
  }
}
