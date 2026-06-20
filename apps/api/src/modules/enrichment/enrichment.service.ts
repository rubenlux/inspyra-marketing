import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateEnrichmentJobDto } from './dto/create-enrichment-job.dto';
import { spawn } from 'child_process';
import * as path from 'path';

const SCORE_THRESHOLD = 75; // only APROBADO_IA (75-89) and PRIORIDAD_MAXIMA (90+)

// Recomputes problems that can be verified from enrichment data.
// Non-verifiable problems (e.g., SEO, site speed) are carried over from the original snapshot.
function recomputeCurrentProblems(
  prospectSnapshot: {
    website?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    googleBusiness?: string | null;
    fuente?: string | null;
    problemasEncontrados: string[];
  },
  enrichment: {
    instagram?: string | null;
    facebook?: string | null;
    googleBusiness?: string | null;
  },
): string[] {
  const foundViaGoogleMaps = prospectSnapshot.fuente === 'GOOGLE_MAPS';

  const hasWeb = !!prospectSnapshot.website;
  const hasSocial = !!(
    enrichment.instagram ?? enrichment.facebook ??
    prospectSnapshot.instagram ?? prospectSnapshot.facebook
  );
  // GBP URL confirmed by enrichment = fully claimed/optimized profile
  const hasGBPUrl = !!(enrichment.googleBusiness ?? prospectSnapshot.googleBusiness);

  const verifiableProblems: string[] = [];
  if (!hasWeb)    verifiableProblems.push('Sin sitio web');
  if (!hasSocial) verifiableProblems.push('Sin redes sociales');

  if (!hasGBPUrl) {
    if (foundViaGoogleMaps) {
      // Being found on Google Maps = has some Maps presence; gap is about profile quality, not existence
      verifiableProblems.push('Perfil GBP sin reclamar');
    } else {
      verifiableProblems.push('Sin Google Business Profile');
    }
  }
  // If hasGBPUrl = true: no GBP problem at all (profile is confirmed and reachable)

  // Carry over non-verifiable problems (SEO, speed, agenda, etc.) from the original snapshot
  const verifiablePattern = /sin.*web|sin.*sitio|sin.*redes|sin.*instagram|sin.*social|sin.*gbp|sin.*google.*business|sin.*ficha|perfil gbp/i;
  const nonVerifiable = (prospectSnapshot.problemasEncontrados ?? []).filter(p => !verifiablePattern.test(p));

  return [...new Set([...verifiableProblems, ...nonVerifiable])];
}

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
  confianza?: string;
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
      include: { validation: true },
    });
    if (!prospect) throw new NotFoundException(`Prospecto ${dto.prospectId} no encontrado`);

    // Gate 1: Opportunity Evaluator must have run first.
    if (!prospect.validation) {
      throw new BadRequestException(
        `El Evaluador de oportunidad no procesó este prospecto. ` +
        `Solo se pueden enriquecer prospectos con APROBADO_IA (≥${SCORE_THRESHOLD}) o PRIORIDAD_MAXIMA (≥90).`,
      );
    }
    // Gate 2: A human must have approved the analysis before enrichment can start.
    if (prospect.validation.status !== 'VALIDATED') {
      throw new BadRequestException(
        `El análisis de oportunidad no fue aprobado por un humano (estado: ${prospect.validation.status}). ` +
        `Revisá y aprobá el análisis en la pestaña Validación antes de iniciar el enriquecimiento.`,
      );
    }
    // Gate 3: Score threshold — bypassed when a human explicitly validated (VALIDATED).
    // The score gate prevents auto-enrichment of low-quality prospects; human approval overrides it.
    if (prospect.validation.status !== 'VALIDATED') {
      const effectiveScore = prospect.validation.humanScore ?? prospect.validation.agentScore;
      if (effectiveScore < SCORE_THRESHOLD) {
        throw new BadRequestException(
          `Opportunity Score ${effectiveScore} por debajo del umbral (${SCORE_THRESHOLD}). ` +
          `Solo APROBADO_IA o PRIORIDAD_MAXIMA pueden ser enriquecidos, o aprobá manualmente el análisis.`,
        );
      }
    }

    // Gate 4: Idempotency — prevent duplicate enrichment agents running in parallel.
    const activeJob = await this.prisma.enrichmentJob.findFirst({
      where: { prospectId: dto.prospectId, tenantId, status: { in: ['PENDING', 'RUNNING'] } },
      select: { id: true, status: true },
    });
    if (activeJob) {
      throw new ConflictException(
        `Ya existe un enriquecimiento en curso para este prospecto (job ${activeJob.id}, estado: ${activeJob.status}). ` +
        `Esperá a que finalice antes de iniciar uno nuevo.`,
      );
    }

    const job = await this.prisma.enrichmentJob.create({
      data: { tenantId, prospectId: dto.prospectId, createdBy: userId, status: 'PENDING' },
    });

    // NUEVO prospects (imported from Google Maps) must reach INVESTIGADO before enrichment
    // advances them to ENRIQUECIDO. VALID_TRANSITIONS allows NUEVO → INVESTIGADO.
    await this.prisma.prospect.updateMany({
      where: { id: dto.prospectId, tenantId, estado: 'NUEVO' },
      data: { estado: 'INVESTIGADO' },
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
    const [contactable, pendingReview, approved] = await Promise.all([
      this.prisma.enrichmentResult.count({ where: { tenantId, contactable: true } }),
      this.prisma.enrichmentResult.count({ where: { tenantId, reviewStatus: 'PENDING' } }),
      this.prisma.enrichmentResult.count({ where: { tenantId, reviewStatus: 'APPROVED' } }),
    ]);
    return { pending, running, completed, failed, contactable, pendingReview, approved };
  }

  async getResultByProspect(prospectId: string, tenantId: string) {
    return this.prisma.enrichmentResult.findFirst({ where: { prospectId, tenantId } });
  }

  async getOutreachQueue(tenantId: string) {
    const raw = await this.prisma.prospect.findMany({
      where: {
        tenantId,
        estado: 'LISTO_OUTREACH',
        deletedAt: null,
        enrichmentResult: { reviewStatus: 'APPROVED' },
      },
      orderBy: [{ commercialScore: 'desc' }, { score: 'desc' }],
      take: 20,
      select: {
        id: true,
        nombreEmpresa: true,
        rubro: true,
        ciudad: true,
        score: true,
        commercialScore: true,
        enrichmentResult: {
          select: {
            contactabilityScore: true,
            confianza: true,
            email: true,
            telefono: true,
            whatsapp: true,
            recommendedStatus: true,
          },
        },
      },
    });

    return { total: raw.length, prospects: raw };
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
    if (!result) throw new NotFoundException(`Enrichment result ${resultId} no encontrado`);

    const updated = await this.prisma.enrichmentResult.update({
      where: { id: resultId },
      data: {
        reviewStatus: status,
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes: notes ?? null,
      },
    });

    if (status === 'APPROVED' && result.contactable) {
      // Commercial Score = floor((opportunityScore + contactabilityScore) / 2)
      // opportunityScore comes exclusively from the Opportunity Agent (validation.agentScore).
      const opportunityScore = result.prospect.validation?.agentScore ?? result.prospect.score;
      const commercialScore = Math.floor(
        (opportunityScore + (result.contactabilityScore ?? 0)) / 2,
      );
      // Advance to LISTO_PROPUESTA — not LISTO_OUTREACH.
      // LISTO_OUTREACH only happens after the Proposal Engine produces an APPROVED proposal.
      await this.prisma.prospect.updateMany({
        where: { id: result.prospectId, tenantId, estado: 'ENRIQUECIDO' },
        data: { estado: 'LISTO_PROPUESTA', commercialScore },
      });
      this.logger.log(
        `[EnrichReview] Prospect ${result.prospectId} → LISTO_PROPUESTA | commercial: ${commercialScore}`,
      );
    } else if (status === 'APPROVED' && !result.contactable) {
      this.logger.warn(`[EnrichReview] Approved but not contactable — prospect stays ENRIQUECIDO`);
    } else if (status === 'REJECTED') {
      // Revert to INVESTIGADO for possible re-enrichment
      await this.prisma.prospect.updateMany({
        where: { id: result.prospectId, tenantId, estado: 'ENRIQUECIDO' },
        data: { estado: 'INVESTIGADO', commercialScore: null },
      });
      this.logger.log(`[EnrichReview] Rejected — prospect ${result.prospectId} → INVESTIGADO`);
    }

    return updated;
  }

  // Agents can only SUGGEST — not approve.  reviewStatus stays PENDING until a human acts.
  async suggestReview(
    resultId: string,
    tenantId: string,
    agentId: string,
    recommendedStatus: 'SUGGEST_APPROVE' | 'SUGGEST_REJECT',
    notes?: string,
  ) {
    const result = await this.prisma.enrichmentResult.findFirst({
      where: { id: resultId, tenantId },
    });
    if (!result) throw new NotFoundException(`Enrichment result ${resultId} no encontrado`);

    return this.prisma.enrichmentResult.update({
      where: { id: resultId },
      data: {
        recommendedStatus,
        recommendNotes: notes ?? null,
        recommendedBy: agentId,
      },
    });
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
      facebook?: string | null;
      googleBusiness?: string | null;
      linkedin?: string | null;
      fuente?: string | null;
      oportunidadDetectada?: string | null;
      problemasEncontrados: string[];
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

      this.logger.log(`[BUG-004B] RAW ENRICHMENT OUTPUT:\n${raw}`);

      const data = this.parseEnrichmentOutput(raw);

      this.logger.log(`[BUG-004B] PARSED ENRICHMENT:\n${JSON.stringify(data, null, 2)}`);

      const contactable = Boolean(data.email || data.telefono || data.whatsapp || data.formularioWeb);
      const contactabilityScore = this.computeContactabilityScore(data);

      this.logger.log(`[BUG-004B] CONTACTABILITY:\n${JSON.stringify({ email: data.email, telefono: data.telefono, whatsapp: data.whatsapp, linkedin: data.linkedin, facebook: data.facebook, instagram: data.instagram, score: contactabilityScore }, null, 2)}`);

      await this.prisma.enrichmentResult.upsert({
        where: { prospectId: prospect.id },
        create: {
          tenantId,
          prospectId: prospect.id,
          jobId,
          ...data,
          contactable,
          contactabilityScore,
          reviewStatus: 'PENDING',
          rawOutput: raw,
        },
        update: {
          ...data,
          contactable,
          contactabilityScore,
          reviewStatus: 'PENDING',
          rawOutput: raw,
          jobId,
        },
      });

      // Advance prospect estado to ENRIQUECIDO if still INVESTIGADO
      await this.prisma.prospect.updateMany({
        where: { id: prospect.id, tenantId, estado: 'INVESTIGADO' },
        data: { estado: 'ENRIQUECIDO' },
      });

      // Recompute currentProblems from verified enrichment data — agents read this field
      const currentProblems = recomputeCurrentProblems(prospect, data);
      await this.prisma.prospect.update({
        where: { id: prospect.id },
        data: { currentProblems },
      });
      this.logger.log(`[EnrichJob ${jobId}] currentProblems: [${currentProblems.join(', ')}]`);

      await this.prisma.enrichmentJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          agentOutput: `Completado. Contactable: ${contactable} | Score: ${contactabilityScore} | Confianza: ${data.confianza ?? 'N/A'}`,
        },
      });

      this.logger.log(`[EnrichJob ${jobId}] Done — contactable: ${contactable}, score: ${contactabilityScore}`);
    } catch (err) {
      this.logger.error(`[EnrichJob ${jobId}] Failed: ${err.message}`);
      await this.prisma.enrichmentJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', completedAt: new Date(), errorMessage: String(err.message) },
      });
    }
  }

  // ── Contactability Score ──────────────────────────────────────────────────────

  private computeContactabilityScore(data: EnrichmentData): number {
    let points = 0;
    if (data.email)         points += 35;
    if (data.telefono)      points += 30;
    if (data.whatsapp)      points += 20;
    if (data.formularioWeb) points += 15;
    if (data.googleBusiness) points += 5;
    if (data.linkedin)      points += 5;
    if (data.nombreDecidsor) points += 5;
    if (data.facebook)      points += 2;
    if (data.instagram)     points += 2;

    const raw = Math.min(points, 100);

    const mult =
      data.confianza === 'ALTA'  ? 1.0 :
      data.confianza === 'MEDIA' ? 0.85 :
      0.65; // BAJA or missing

    return Math.round(raw * mult);
  }

  // ── Enrichment Prompt (Sonnet + web search instructions) ─────────────────────

  private async enrichWithSonnet(prospect: {
    nombreEmpresa: string;
    rubro?: string | null;
    ciudad?: string | null;
    pais?: string | null;
    website?: string | null;
    instagram?: string | null;
    linkedin?: string | null;
    oportunidadDetectada?: string | null;
  }): Promise<string> {
    const website = prospect.website ?? null;
    const instagram = prospect.instagram ?? null;
    const linkedin = prospect.linkedin ?? null;

    const prompt = `Eres un agente de enriquecimiento de leads B2B. Encontrá datos de contacto reales de esta empresa latinoamericana.

EMPRESA:
- Nombre: ${prospect.nombreEmpresa}
- Rubro: ${prospect.rubro ?? 'Desconocido'}
- Ubicación: ${[prospect.ciudad, prospect.pais].filter(Boolean).join(', ') || 'Desconocida'}
- Website: ${website ?? 'Sin web conocida'}
- Instagram: ${instagram ?? 'Desconocido'}
- LinkedIn: ${linkedin ?? 'Desconocido'}
- Oportunidad: ${prospect.oportunidadDetectada ?? 'N/A'}

INSTRUCCIONES — MÁXIMO 4 herramientas en total:
1. Si hay website: WebFetch para extraer email, teléfono, formulario, redes sociales
2. Si no hay suficiente info: WebSearch "${prospect.nombreEmpresa} ${prospect.ciudad ?? ''} contacto"
3. Solo si no encontraste nada: buscar LinkedIn o Google Business
4. Identificar decisor (dueño, fundador, gerente) si aparece en los resultados anteriores
confianza: ALTA=datos reales del sitio, MEDIA=redes sociales, BAJA=inferido

Responde SOLO con JSON válido, sin texto adicional:
{"email":null,"telefono":null,"whatsapp":null,"formularioWeb":null,"googleBusiness":null,"linkedin":null,"facebook":null,"instagram":null,"direccion":null,"anioFundacion":null,"empleadosReal":null,"nombreDecidsor":null,"rolDecidsor":null,"linkedinDecidsor":null,"confianza":"BAJA"}`;

    return this.spawnClaudeAgentic(prompt, 'claude-sonnet-4-6', 60_000, 240_000);
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
      if (parsed.confianza && ['ALTA', 'MEDIA', 'BAJA'].includes(parsed.confianza)) clean.confianza = parsed.confianza;
      return clean;
    } catch {
      this.logger.warn('Enrichment: JSON parse error');
      return {};
    }
  }

  private async updateOutput(jobId: string, msg: string) {
    await this.prisma.enrichmentJob.update({ where: { id: jobId }, data: { agentOutput: msg } });
  }

  // Stream-json mode: stdout receives one JSON event per line as tool calls happen.
  // idleTimeoutMs kills the process if no output arrives for that duration (detects stuck WebFetch).
  // totalTimeoutMs is a hard ceiling regardless of activity.
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
        // Reset idle timer on every stdout byte (tool calls generate events continuously)
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
