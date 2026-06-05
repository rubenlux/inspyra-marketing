import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { spawn } from 'child_process';
import * as path from 'path';

interface ProposalData {
  resumenEjecutivo?: string;
  diagnostico?: string;
  problemasDetectados?: Array<{ problema: string; impacto: string }>;
  objetivos?: string[];
  serviciosRecomendados?: Array<{
    nombre: string;
    descripcion: string;
    precio: number;
    billingModel: string;
    prioridad: string;
  }>;
  pricing?: {
    setup: number;
    mensual: number;
    total12Meses: number;
    nota: string;
  };
  cronograma?: Array<{ semana: number; entregable: string }>;
  justificacion?: string;
  cta?: string;
}

@Injectable()
export class ProposalsService {
  private readonly logger = new Logger(ProposalsService.name);
  private readonly projectRoot = path.resolve(__dirname, '../../../../../');

  constructor(private readonly prisma: PrismaService) {}

  // ── Public API ────────────────────────────────────────────────────────────────

  async generate(prospectId: string, tenantId: string, userId: string) {
    const prospect = await this.prisma.prospect.findFirst({
      where: { id: prospectId, tenantId, deletedAt: null },
      include: {
        validation: true,
        enrichmentResult: true,
      },
    });
    if (!prospect) throw new NotFoundException(`Prospecto ${prospectId} no encontrado`);

    // Gate 1: prospect must be in LISTO_PROPUESTA
    if (prospect.estado !== 'LISTO_PROPUESTA') {
      throw new BadRequestException(
        `El prospecto no está listo para propuesta (estado: ${prospect.estado}). ` +
        `Debe estar en LISTO_PROPUESTA.`,
      );
    }

    // Gate 2: enrichment must be APPROVED
    if (!prospect.enrichmentResult || prospect.enrichmentResult.reviewStatus !== 'APPROVED') {
      throw new BadRequestException(
        `El enriquecimiento no fue aprobado por un humano. ` +
        `Aprobá los datos de contacto antes de generar una propuesta.`,
      );
    }

    // Gate 3: Idempotency — only one DRAFT at a time per prospect
    const activeDraft = await this.prisma.proposal.findFirst({
      where: { prospectId, tenantId, status: 'DRAFT', jobStatus: { in: ['PENDING', 'RUNNING'] } },
      select: { id: true },
    });
    if (activeDraft) {
      throw new ConflictException(
        `Ya hay una propuesta siendo generada para este prospecto. ` +
        `Esperá a que finalice antes de generar una nueva.`,
      );
    }

    // Compute next version number
    const lastProposal = await this.prisma.proposal.findFirst({
      where: { prospectId, tenantId },
      orderBy: { version: 'desc' },
      select: { id: true, version: true },
    });
    const version = (lastProposal?.version ?? 0) + 1;

    const proposal = await this.prisma.proposal.create({
      data: {
        tenantId,
        prospectId,
        version,
        parentProposalId: lastProposal?.id ?? null,
        status: 'DRAFT',
        generatedBy: 'proposal-agent',
        jobStatus: 'PENDING',
      },
    });

    // Load catalog items for pricing
    const catalog = await this.prisma.serviceCatalogItem.findMany({
      where: { tenantId, activo: true },
      select: { nombre: true, descripcionDefault: true, precioBaseUsd: true, billingModelDefault: true, categoria: true },
    });

    setImmediate(() =>
      this.runProposalAgent(proposal.id, tenantId, prospect, catalog).catch(err =>
        this.logger.error(`[ProposalJob ${proposal.id}] Unhandled: ${err.message}`),
      ),
    );

    return proposal;
  }

  async findByProspect(prospectId: string, tenantId: string) {
    return this.prisma.proposal.findMany({
      where: { prospectId, tenantId },
      orderBy: { version: 'desc' },
    });
  }

  async findLatest(prospectId: string, tenantId: string) {
    return this.prisma.proposal.findFirst({
      where: { prospectId, tenantId },
      orderBy: { version: 'desc' },
    });
  }

  async approve(proposalId: string, tenantId: string, userId: string) {
    const proposal = await this.prisma.proposal.findFirst({
      where: { id: proposalId, tenantId },
      include: {
        prospect: {
          include: { enrichmentResult: true },
        },
      },
    });
    if (!proposal) throw new NotFoundException(`Propuesta ${proposalId} no encontrada`);
    if (proposal.status !== 'DRAFT') {
      throw new BadRequestException(`Solo se puede aprobar una propuesta en estado DRAFT (actual: ${proposal.status})`);
    }
    if (proposal.jobStatus !== 'COMPLETED') {
      throw new BadRequestException(`La propuesta no terminó de generarse aún (jobStatus: ${proposal.jobStatus})`);
    }

    // Gate: enrichment must still be APPROVED before advancing to LISTO_OUTREACH
    const enrichment = proposal.prospect.enrichmentResult;
    if (!enrichment || enrichment.reviewStatus !== 'APPROVED') {
      throw new BadRequestException(
        `El enriquecimiento ya no está aprobado. No se puede avanzar a LISTO_OUTREACH.`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.proposal.update({
        where: { id: proposalId },
        data: { status: 'APPROVED', approvedBy: userId, approvedAt: new Date() },
      }),
      this.prisma.prospect.updateMany({
        where: { id: proposal.prospectId, tenantId, estado: 'LISTO_PROPUESTA' },
        data: { estado: 'LISTO_OUTREACH' },
      }),
    ]);

    this.logger.log(`[Proposal ${proposalId}] APPROVED → prospect ${proposal.prospectId} → LISTO_OUTREACH`);

    return this.prisma.proposal.findUnique({ where: { id: proposalId } });
  }

  async reject(proposalId: string, tenantId: string, rejectionReason: string) {
    const proposal = await this.prisma.proposal.findFirst({
      where: { id: proposalId, tenantId },
    });
    if (!proposal) throw new NotFoundException(`Propuesta ${proposalId} no encontrada`);
    if (proposal.status !== 'DRAFT') {
      throw new BadRequestException(`Solo se puede rechazar una propuesta en estado DRAFT`);
    }

    return this.prisma.proposal.update({
      where: { id: proposalId },
      data: { status: 'REJECTED', rejectionReason },
    });
  }

  async regenerate(proposalId: string, tenantId: string, userId: string) {
    const existing = await this.prisma.proposal.findFirst({
      where: { id: proposalId, tenantId },
      include: {
        prospect: { include: { validation: true, enrichmentResult: true } },
      },
    });
    if (!existing) throw new NotFoundException(`Propuesta ${proposalId} no encontrada`);

    // Mark old version as rejected
    await this.prisma.proposal.update({
      where: { id: proposalId },
      data: { status: 'REJECTED', rejectionReason: 'Regenerada por usuario' },
    });

    // Delegate to generate() — it will compute next version and set parentProposalId correctly
    return this.generate(existing.prospectId, tenantId, userId);
  }

  // ── Agent ──────────────────────────────────────────────────────────────────────

  private async runProposalAgent(
    proposalId: string,
    tenantId: string,
    prospect: any,
    catalog: any[],
  ) {
    await this.prisma.proposal.update({
      where: { id: proposalId },
      data: { jobStatus: 'RUNNING', startedAt: new Date() },
    });

    this.logger.log(`[ProposalJob ${proposalId}] Start — ${prospect.nombreEmpresa}`);

    try {
      const prompt = this.buildPrompt(prospect, catalog);
      const raw = await this.spawnClaude(prompt, 'claude-sonnet-4-6', 120_000);

      const data = this.parseProposalOutput(raw);
      const markdown = this.toMarkdown(data, prospect);

      await this.prisma.proposal.update({
        where: { id: proposalId },
        data: {
          jobStatus: 'COMPLETED',
          completedAt: new Date(),
          proposalData: data as any,
          proposalMarkdown: markdown,
          agentOutput: raw,
        },
      });

      this.logger.log(`[ProposalJob ${proposalId}] Completed — ${prospect.nombreEmpresa}`);
    } catch (err) {
      this.logger.error(`[ProposalJob ${proposalId}] Failed: ${err.message}`);
      await this.prisma.proposal.update({
        where: { id: proposalId },
        data: { jobStatus: 'FAILED', errorMessage: String(err.message), completedAt: new Date() },
      });
    }
  }

  private buildPrompt(prospect: any, catalog: any[]): string {
    const v = prospect.validation;
    const e = prospect.enrichmentResult;

    const catalogLines = catalog
      .map(c => `- ${c.nombre}: USD ${Number(c.precioBaseUsd)} (${c.billingModelDefault}) — ${c.descripcionDefault ?? ''}`)
      .join('\n');

    const serviciosRecomendados = v?.servicesRecommended?.length
      ? v.servicesRecommended.join(', ')
      : prospect.servicioSugerido ?? 'No especificado';

    return `Sos un consultor estratégico digital especializado en agencias de marketing para PYMES latinoamericanas. Tu tarea es generar una propuesta comercial profesional y personalizada.

DATOS DEL PROSPECTO:
- Empresa: ${prospect.nombreEmpresa}
- Rubro: ${prospect.rubro ?? 'No especificado'}
- Ubicación: ${[prospect.ciudad, prospect.pais].filter(Boolean).join(', ') || 'No especificada'}
- Website: ${prospect.website ?? 'Sin web'}

OPORTUNIDAD DETECTADA:
${prospect.oportunidadDetectada ?? 'No especificada'}

PROBLEMAS IDENTIFICADOS:
${(prospect.problemasEncontrados ?? []).map((p: string) => `- ${p}`).join('\n') || '- No especificados'}

EVALUACIÓN DE OPORTUNIDAD (Opportunity Agent):
- Opportunity Score: ${v?.agentScore ?? 'N/A'} / 100
- Ticket estimado: USD ${v?.estimatedTicketUsd ?? 'N/A'}
- Servicios recomendados: ${serviciosRecomendados}
- Razonamiento del agente: ${v?.reasoning ?? 'No disponible'}
${v?.decisionFactors ? `- Factores: Problema=${v.decisionFactors.problemScore}, Prioridad=${v.decisionFactors.priorityScore}, Fit=${v.decisionFactors.fitScore}, Ticket=${v.decisionFactors.ticketScore}` : ''}

DATOS DE CONTACTO (Enrichment):
- Contactabilidad: ${e?.contactabilityScore ?? 'N/A'} / 100
- Decisor: ${e?.nombreDecidsor ?? 'No identificado'}${e?.rolDecidsor ? ` (${e.rolDecidsor})` : ''}

CATÁLOGO DE SERVICIOS DISPONIBLES (usar precios exactos del catálogo, sin modificar):
${catalogLines}

INSTRUCCIONES:
1. Generá una propuesta personalizada para esta empresa específica
2. Usá los precios EXACTOS del catálogo — no inventes precios ni hagas descuentos
3. Elegí solo los servicios que realmente resuelven los problemas detectados
4. El diagnóstico debe mencionar situaciones concretas de esta empresa
5. El CTA debe ser directo y orientado a agendar una reunión
6. Respondé SOLO con JSON válido (sin markdown, sin texto adicional)

{
  "resumenEjecutivo": "string — 2-3 oraciones sobre la oportunidad",
  "diagnostico": "string — situación actual de la empresa, sus problemas y el impacto en el negocio",
  "problemasDetectados": [{"problema": "string", "impacto": "string"}],
  "objetivos": ["string"],
  "serviciosRecomendados": [
    {
      "nombre": "string — nombre exacto del catálogo",
      "descripcion": "string — por qué este servicio para esta empresa",
      "precio": number,
      "billingModel": "UNICO|MENSUAL|POR_HORAS",
      "prioridad": "ALTA|MEDIA|BAJA"
    }
  ],
  "pricing": {
    "setup": number,
    "mensual": number,
    "total12Meses": number,
    "nota": "string"
  },
  "cronograma": [{"semana": number, "entregable": "string"}],
  "justificacion": "string — por qué esta propuesta es la correcta para esta empresa",
  "cta": "string — llamada a la acción concreta"
}`;
  }

  private parseProposalOutput(raw: string): ProposalData {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      this.logger.warn('ProposalAgent: no JSON found in output');
      return {};
    }
    try {
      return JSON.parse(jsonMatch[0]) as ProposalData;
    } catch {
      this.logger.warn('ProposalAgent: JSON parse error');
      return {};
    }
  }

  private toMarkdown(data: ProposalData, prospect: any): string {
    const lines: string[] = [];

    lines.push(`# Propuesta Comercial — ${prospect.nombreEmpresa}`);
    lines.push('');

    if (data.resumenEjecutivo) {
      lines.push('## Resumen Ejecutivo');
      lines.push(data.resumenEjecutivo);
      lines.push('');
    }

    if (data.diagnostico) {
      lines.push('## Diagnóstico');
      lines.push(data.diagnostico);
      lines.push('');
    }

    if (data.problemasDetectados?.length) {
      lines.push('## Problemas Detectados');
      data.problemasDetectados.forEach(p => {
        lines.push(`**${p.problema}**`);
        lines.push(`_Impacto: ${p.impacto}_`);
        lines.push('');
      });
    }

    if (data.objetivos?.length) {
      lines.push('## Objetivos');
      data.objetivos.forEach(o => lines.push(`- ${o}`));
      lines.push('');
    }

    if (data.serviciosRecomendados?.length) {
      lines.push('## Servicios Recomendados');
      data.serviciosRecomendados.forEach(s => {
        const precio = s.billingModel === 'MENSUAL' ? `USD ${s.precio}/mes` : `USD ${s.precio}`;
        lines.push(`### ${s.nombre} — ${precio}`);
        lines.push(s.descripcion);
        lines.push('');
      });
    }

    if (data.pricing) {
      lines.push('## Inversión');
      if (data.pricing.setup > 0) lines.push(`- **Setup inicial:** USD ${data.pricing.setup}`);
      if (data.pricing.mensual > 0) lines.push(`- **Fee mensual:** USD ${data.pricing.mensual}/mes`);
      if (data.pricing.total12Meses > 0) lines.push(`- **Total 12 meses:** USD ${data.pricing.total12Meses}`);
      if (data.pricing.nota) lines.push(`_${data.pricing.nota}_`);
      lines.push('');
    }

    if (data.cronograma?.length) {
      lines.push('## Cronograma');
      data.cronograma.forEach(c => lines.push(`- **Semana ${c.semana}:** ${c.entregable}`));
      lines.push('');
    }

    if (data.justificacion) {
      lines.push('## Por Qué Esta Propuesta');
      lines.push(data.justificacion);
      lines.push('');
    }

    if (data.cta) {
      lines.push('## Próximos Pasos');
      lines.push(data.cta);
    }

    return lines.join('\n');
  }

  private spawnClaude(prompt: string, model: string, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = [
        '-p', prompt,
        '--output-format', 'text',
        '--dangerously-skip-permissions',
        '--model', model,
        // No WebFetch/WebSearch — proposal builds from DB snapshot only
      ];
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
