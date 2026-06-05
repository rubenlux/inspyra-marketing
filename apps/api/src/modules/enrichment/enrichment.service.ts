import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateEnrichmentJobDto } from './dto/create-enrichment-job.dto';
import { spawn } from 'child_process';
import * as path from 'path';

const SCORE_THRESHOLD = 75; // only APROBADO_IA (75-89) and PRIORIDAD_MAXIMA (90+)

interface EnrichmentData {
  email?: string;
  telefono?: string;
  whatsapp?: string;
  formularioWeb?: string;
  googleBusiness?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  direccion?: string;
  anioFundacion?: number;
  empleadosReal?: number;
  nombreDecidsor?: string;
  rolDecidsor?: string;
  linkedinDecidsor?: string;
}

@Injectable()
export class EnrichmentService {
  private readonly logger = new Logger(EnrichmentService.name);
  private readonly projectRoot = path.resolve(__dirname, '../../../../../');

  constructor(private readonly prisma: PrismaService) {}

  // ── Public API ────────────────────────────────────────────────────────────────

  async createJob(dto: CreateEnrichmentJobDto, tenantId: string, userId: string) {
    const prospect = await this.prisma.prospect.findFirst({
      where: { id: dto.prospectId, tenantId, deletedAt: null },
    });
    if (!prospect) throw new NotFoundException(`Prospecto ${dto.prospectId} no encontrado`);
    if (prospect.score < SCORE_THRESHOLD) {
      throw new BadRequestException(
        `Score ${prospect.score} por debajo del umbral de enriquecimiento (${SCORE_THRESHOLD}). ` +
        `Solo se enriquecen prospectos APROBADO_IA o PRIORIDAD_MAXIMA.`,
      );
    }

    const job = await this.prisma.enrichmentJob.create({
      data: { tenantId, prospectId: dto.prospectId, createdBy: userId, status: 'PENDING' },
    });

    setImmediate(() =>
      this.runEnrichment(job.id, tenantId, prospect).catch(err =>
        this.logger.error(`[EnrichJob ${job.id}] Unhandled: ${err.message}`),
      ),
    );

    return job;
  }

  async getJob(jobId: string, tenantId: string) {
    const job = await this.prisma.enrichmentJob.findFirst({
      where: { id: jobId, tenantId },
      include: { result: true },
    });
    if (!job) throw new NotFoundException(`Enrichment job ${jobId} no encontrado`);
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
    const contactable = await this.prisma.enrichmentResult.count({
      where: { tenantId, contactable: true },
    });
    return { pending, running, completed, failed, contactable };
  }

  async getResultByProspect(prospectId: string, tenantId: string) {
    return this.prisma.enrichmentResult.findFirst({ where: { prospectId, tenantId } });
  }

  // ── Pipeline ──────────────────────────────────────────────────────────────────

  private async runEnrichment(
    jobId: string,
    tenantId: string,
    prospect: {
      id: string;
      nombreEmpresa: string;
      rubro?: string | null;
      ciudad?: string | null;
      pais?: string | null;
      website?: string | null;
      instagram?: string | null;
      oportunidadDetectada?: string | null;
    },
  ) {
    await this.prisma.enrichmentJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    this.logger.log(`[EnrichJob ${jobId}] Start — ${prospect.nombreEmpresa}`);

    try {
      await this.updateOutput(jobId, `Buscando datos de contacto para "${prospect.nombreEmpresa}"…`);

      const raw = await this.enrichWithSonnet(prospect);
      const data = this.parseEnrichmentOutput(raw);

      const contactable = Boolean(data.email || data.telefono || data.whatsapp || data.formularioWeb);

      await this.prisma.enrichmentResult.upsert({
        where: { prospectId: prospect.id },
        create: {
          tenantId,
          prospectId: prospect.id,
          jobId,
          ...data,
          contactable,
          rawOutput: raw,
        },
        update: {
          ...data,
          contactable,
          rawOutput: raw,
          jobId,
        },
      });

      // Advance prospect estado to ENRIQUECIDO if still INVESTIGADO
      await this.prisma.prospect.updateMany({
        where: { id: prospect.id, tenantId, estado: 'INVESTIGADO' },
        data: { estado: 'ENRIQUECIDO' },
      });

      await this.prisma.enrichmentJob.update({
        where: { id: jobId },
        data: { status: 'COMPLETED', completedAt: new Date(), agentOutput: `Completado. Contactable: ${contactable}` },
      });

      this.logger.log(`[EnrichJob ${jobId}] Done — contactable: ${contactable}`);
    } catch (err) {
      this.logger.error(`[EnrichJob ${jobId}] Failed: ${err.message}`);
      await this.prisma.enrichmentJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', completedAt: new Date(), errorMessage: String(err.message) },
      });
    }
  }

  private async enrichWithSonnet(prospect: {
    nombreEmpresa: string;
    rubro?: string | null;
    ciudad?: string | null;
    pais?: string | null;
    website?: string | null;
    instagram?: string | null;
    oportunidadDetectada?: string | null;
  }): Promise<string> {
    const prompt = `Eres un agente de enriquecimiento de leads B2B para una agencia de marketing digital.

EMPRESA A ENRIQUECER:
- Nombre: ${prospect.nombreEmpresa}
- Rubro: ${prospect.rubro ?? 'Desconocido'}
- Ciudad: ${[prospect.ciudad, prospect.pais].filter(Boolean).join(', ') || 'Desconocida'}
- Website: ${prospect.website ?? 'Sin web'}
- Instagram: ${prospect.instagram ?? 'Desconocido'}
- Oportunidad detectada: ${prospect.oportunidadDetectada ?? 'N/A'}

OBJETIVO: Encontrar datos de contacto y presencia digital verificada de esta empresa.

INSTRUCCIONES:
1. Analiza el nombre, rubro y ciudad para inferir datos de contacto probables
2. Si tiene website, infiere el email de contacto típico (ej: info@, contacto@, hola@)
3. Busca o infiere su presencia en Google Business, LinkedIn, Facebook
4. Identifica quién podría ser el decisor (dueño, fundador, gerente comercial)
5. Estima datos de la empresa si son inferibles

Responde SOLO con un JSON válido sin texto adicional:

{
  "email": "string o null",
  "telefono": "string o null (con código de país)",
  "whatsapp": "string o null",
  "formularioWeb": "URL del formulario de contacto o null",
  "googleBusiness": "URL de Google Business o null",
  "linkedin": "URL LinkedIn empresa o null",
  "facebook": "URL Facebook o null",
  "instagram": "handle o URL Instagram o null",
  "direccion": "dirección física o null",
  "anioFundacion": número o null,
  "empleadosReal": número estimado o null,
  "nombreDecidsor": "nombre del decisor o null",
  "rolDecidsor": "Dueño|Fundador|Gerente Comercial|Director o null",
  "linkedinDecidsor": "URL LinkedIn del decisor o null",
  "confianza": "ALTA|MEDIA|BAJA"
}`;

    return this.spawnClaudeText(prompt, 'claude-haiku-4-5-20251001', 90_000);
  }

  private parseEnrichmentOutput(raw: string): EnrichmentData {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      this.logger.warn('Enrichment: no JSON found in output');
      return {};
    }
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const clean: EnrichmentData = {};
      if (parsed.email && typeof parsed.email === 'string') clean.email = parsed.email;
      if (parsed.telefono && typeof parsed.telefono === 'string') clean.telefono = parsed.telefono;
      if (parsed.whatsapp && typeof parsed.whatsapp === 'string') clean.whatsapp = parsed.whatsapp;
      if (parsed.formularioWeb && typeof parsed.formularioWeb === 'string') clean.formularioWeb = parsed.formularioWeb;
      if (parsed.googleBusiness && typeof parsed.googleBusiness === 'string') clean.googleBusiness = parsed.googleBusiness;
      if (parsed.linkedin && typeof parsed.linkedin === 'string') clean.linkedin = parsed.linkedin;
      if (parsed.facebook && typeof parsed.facebook === 'string') clean.facebook = parsed.facebook;
      if (parsed.instagram && typeof parsed.instagram === 'string') clean.instagram = parsed.instagram;
      if (parsed.direccion && typeof parsed.direccion === 'string') clean.direccion = parsed.direccion;
      if (typeof parsed.anioFundacion === 'number') clean.anioFundacion = parsed.anioFundacion;
      if (typeof parsed.empleadosReal === 'number') clean.empleadosReal = parsed.empleadosReal;
      if (parsed.nombreDecidsor && typeof parsed.nombreDecidsor === 'string') clean.nombreDecidsor = parsed.nombreDecidsor;
      if (parsed.rolDecidsor && typeof parsed.rolDecidsor === 'string') clean.rolDecidsor = parsed.rolDecidsor;
      if (parsed.linkedinDecidsor && typeof parsed.linkedinDecidsor === 'string') clean.linkedinDecidsor = parsed.linkedinDecidsor;
      return clean;
    } catch {
      this.logger.warn('Enrichment: JSON parse error');
      return {};
    }
  }

  private async updateOutput(jobId: string, msg: string) {
    await this.prisma.enrichmentJob.update({ where: { id: jobId }, data: { agentOutput: msg } });
  }

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
