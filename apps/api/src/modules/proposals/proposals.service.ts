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

// ── Tipos de salida del agente ───────────────────────────────────────────────

/** Stage 1: Conseguir respuesta. Sin precios, sin cierre. */
interface OutreachBriefData {
  proposalType: 'OUTREACH';
  analysisType: 'OPPORTUNITY' | 'RISK' | 'MIXED';
  industryProfile: string;
  diagnosticoResumen: string;
  problemasDetectados: Array<{ problema: string; impacto: string }>;
  oportunidades: Array<{ oportunidad: string; beneficio: string }>;
  riesgos: string[];
  recomendacionesGenerales: string[];
  cta: string;
  outreachMessage: string; // 150-250 palabras para WhatsApp/Email/DM
}

/** Stage 2: Propuesta completa tras interacción positiva. */
interface CommercialProposalData {
  proposalType: 'COMMERCIAL';
  resumenEjecutivo: string;
  diagnostico: string;
  problemasDetectados: Array<{ problema: string; impacto: string }>;
  objetivos: string[];
  paquetes: Array<{
    nombre: 'Esencial' | 'Crecimiento' | 'Completo';
    descripcion: string;
    incluye: string[];
    ticketRange?: string;   // ARGENTINA/LATAM — rangos, no números exactos
    pricing?: { setup: number; mensual: number }; // USA/CANADA/EUROPE
    destacado?: boolean;
  }>;
  paqueteRecomendado: 'Esencial' | 'Crecimiento' | 'Completo';
  preguntasCalificacion?: string[]; // max 3 — para mercados de entrada
  justificacion: string;
  cta: string;
}

type ProposalData = OutreachBriefData | CommercialProposalData;

// ── Estrategias por mercado ──────────────────────────────────────────────────

const MARKET_CONFIG: Record<string, {
  strategy: string;
  pricingStyle: 'ranges' | 'exact';
  esencialRange: string;
  crecimientoRange: string;
  completoRange: string;
  avoidAnnualTotal: boolean;
}> = {
  ARGENTINA: {
    strategy: 'Reducir fricción. Mostrar paquetes de entrada. Generar confianza antes de pedir inversión. NUNCA mostrar inversión anual completa.',
    pricingStyle: 'ranges',
    esencialRange: 'USD 300–600 (setup único)',
    crecimientoRange: 'USD 600–1.200 (setup) + desde USD 150/mes',
    completoRange: 'USD 1.200–2.500 (setup) + desde USD 300/mes',
    avoidAnnualTotal: true,
  },
  LATAM: {
    strategy: 'ROI rápido. Implementación gradual. Mostrar paquetes escalables. Evitar contratos extensos.',
    pricingStyle: 'ranges',
    esencialRange: 'USD 400–800',
    crecimientoRange: 'USD 800–1.800',
    completoRange: 'USD 1.800–3.500',
    avoidAnnualTotal: true,
  },
  USA: {
    strategy: 'Mayor valor percibido. Propuestas completas. Tickets premium. Permitir servicios avanzados.',
    pricingStyle: 'exact',
    esencialRange: 'USD 1.500–3.000',
    crecimientoRange: 'USD 3.000–6.000',
    completoRange: 'USD 6.000–15.000+',
    avoidAnnualTotal: false,
  },
  CANADA: {
    strategy: 'Similar a USA. Mayor valor percibido. Profesionalismo. Servicios premium.',
    pricingStyle: 'exact',
    esencialRange: 'CAD 1.500–3.000',
    crecimientoRange: 'CAD 3.000–6.000',
    completoRange: 'CAD 6.000–15.000+',
    avoidAnnualTotal: false,
  },
  EUROPE: {
    strategy: 'Profesionalismo. Compliance. Escalabilidad. Retorno a largo plazo.',
    pricingStyle: 'exact',
    esencialRange: 'EUR 1.200–2.500',
    crecimientoRange: 'EUR 2.500–5.000',
    completoRange: 'EUR 5.000–12.000+',
    avoidAnnualTotal: false,
  },
};

// ── Estrategias por industria ────────────────────────────────────────────────

type IndustryKey = 'DENTAL' | 'WINERY' | 'REAL_ESTATE' | 'LEGAL' | 'RETAIL' | 'MEDICAL' | 'HOSPITALITY' | 'GENERIC';

const INDUSTRY_CONFIG: Record<IndustryKey, {
  focos: string[];
  ctaFraming: string; // plantilla para el CTA de primer contacto
  tone: string;
}> = {
  DENTAL: {
    focos: ['confianza de pacientes', 'reputación online', 'visibilidad local', 'captación de nuevos pacientes'],
    ctaFraming: 'Detectamos algunos puntos técnicos que podrían estar afectando la confianza de los pacientes. Si te interesa, podemos compartirte el detalle completo.',
    tone: 'profesional y empático',
  },
  WINERY: {
    focos: ['marca', 'enoturismo digital', 'ventas directas', 'posicionamiento premium'],
    ctaFraming: 'Encontramos varias oportunidades relacionadas con visibilidad online y enoturismo digital. Si te interesa, podemos compartirte el análisis completo.',
    tone: 'sofisticado y apasionado por el producto',
  },
  REAL_ESTATE: {
    focos: ['captación de propietarios', 'consultas entrantes', 'formularios', 'WhatsApp y canales directos'],
    ctaFraming: 'Detectamos oportunidades para aumentar la captación de consultas y propietarios desde canales digitales. Si te interesa, te compartimos el informe completo.',
    tone: 'directo y orientado a resultados',
  },
  LEGAL: {
    focos: ['credibilidad profesional', 'captación de clientes', 'reputación online', 'presencia digital'],
    ctaFraming: 'Identificamos áreas de mejora en la presencia digital que podrían impactar la captación de nuevos clientes. Si te interesa, podemos compartirte el análisis.',
    tone: 'formal y confiable',
  },
  RETAIL: {
    focos: ['tráfico web', 'conversión', 'ventas online', 'visibilidad de marca'],
    ctaFraming: 'Detectamos oportunidades para aumentar el tráfico y las ventas desde canales digitales. Si te interesa, podemos compartirte el informe.',
    tone: 'dinámico y orientado a ventas',
  },
  MEDICAL: {
    focos: ['confianza de pacientes', 'reputación', 'visibilidad local', 'captación'],
    ctaFraming: 'Encontramos algunos aspectos que podrían estar afectando la confianza de los pacientes al buscarte online. Si te interesa, podemos compartirte el detalle.',
    tone: 'profesional y empático',
  },
  HOSPITALITY: {
    focos: ['reservas directas', 'experiencia digital', 'reputación', 'visibilidad en buscadores'],
    ctaFraming: 'Identificamos oportunidades para aumentar las reservas y la visibilidad online. Si te interesa, te compartimos el análisis completo.',
    tone: 'cálido y orientado a experiencia',
  },
  GENERIC: {
    focos: ['presencia digital', 'visibilidad', 'captación de clientes', 'conversión'],
    ctaFraming: 'Encontramos varias oportunidades de mejora en la presencia digital. Si te interesa, podemos compartirte el detalle completo de lo que encontramos.',
    tone: 'consultivo y profesional',
  },
};

function detectIndustryProfile(rubro?: string): IndustryKey {
  if (!rubro) return 'GENERIC';
  const r = rubro.toLowerCase();
  if (/dental|odontolog|clinic.*sal|salud oral/.test(r)) return 'DENTAL';
  if (/vino|bodega|winer|viñedo|enolog/.test(r)) return 'WINERY';
  if (/inmobil|real.?estate|propied|bienes.?raíc/.test(r)) return 'REAL_ESTATE';
  if (/legal|abogad|estudio.?juríd|notaría/.test(r)) return 'LEGAL';
  if (/retail|indumentaria|moda|ropa|tienda|comercio.?minorist/.test(r)) return 'RETAIL';
  if (/médic|medic|clínica|hospital|salud/.test(r)) return 'MEDICAL';
  if (/hotel|restauran|gastro|hospit|turism|café|bar /.test(r)) return 'HOSPITALITY';
  return 'GENERIC';
}

@Injectable()
export class ProposalsService {
  private readonly logger = new Logger(ProposalsService.name);
  private readonly projectRoot = path.resolve(__dirname, '../../../../../');

  constructor(private readonly prisma: PrismaService) {}

  // ── Public API ────────────────────────────────────────────────────────────────

  async generate(
    prospectId: string,
    tenantId: string,
    userId: string,
    proposalType: 'OUTREACH' | 'COMMERCIAL' = 'OUTREACH',
  ) {
    const [prospect, tenant] = await Promise.all([
      this.prisma.prospect.findFirst({
        where: { id: prospectId, tenantId, deletedAt: null },
        include: { validation: true, enrichmentResult: true },
      }),
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { marketProfile: true },
      }),
    ]);

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
        `El enriquecimiento no fue aprobado. ` +
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

    // Compute next version
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
        proposalType,
        status: 'DRAFT',
        generatedBy: 'proposal-agent',
        jobStatus: 'PENDING',
      },
    });

    const marketProfile = (tenant?.marketProfile ?? 'ARGENTINA') as string;

    // Load catalog only for COMMERCIAL proposals
    let catalog: any[] = [];
    if (proposalType === 'COMMERCIAL') {
      catalog = await this.prisma.serviceCatalogItem.findMany({
        where: { tenantId, activo: true },
        select: { nombre: true, descripcionDefault: true, precioBaseUsd: true, billingModelDefault: true, categoria: true },
      });
    }

    setImmediate(() =>
      this.runProposalAgent(proposal.id, tenantId, prospect, catalog, proposalType, marketProfile).catch(err =>
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
      include: { prospect: { include: { enrichmentResult: true } } },
    });
    if (!proposal) throw new NotFoundException(`Propuesta ${proposalId} no encontrada`);
    if (proposal.status !== 'DRAFT') {
      throw new BadRequestException(`Solo se puede aprobar una propuesta en estado DRAFT (actual: ${proposal.status})`);
    }
    if (proposal.jobStatus !== 'COMPLETED') {
      throw new BadRequestException(`La propuesta no terminó de generarse (jobStatus: ${proposal.jobStatus})`);
    }

    // Gate: enrichment must still be APPROVED
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
    const proposal = await this.prisma.proposal.findFirst({ where: { id: proposalId, tenantId } });
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
      include: { prospect: { include: { validation: true, enrichmentResult: true } } },
    });
    if (!existing) throw new NotFoundException(`Propuesta ${proposalId} no encontrada`);

    await this.prisma.proposal.update({
      where: { id: proposalId },
      data: { status: 'REJECTED', rejectionReason: 'Regenerada por usuario' },
    });

    return this.generate(existing.prospectId, tenantId, userId, existing.proposalType as 'OUTREACH' | 'COMMERCIAL');
  }

  // ── Agent ──────────────────────────────────────────────────────────────────────

  private async runProposalAgent(
    proposalId: string,
    tenantId: string,
    prospect: any,
    catalog: any[],
    proposalType: 'OUTREACH' | 'COMMERCIAL',
    marketProfile: string,
  ) {
    await this.prisma.proposal.update({
      where: { id: proposalId },
      data: { jobStatus: 'RUNNING', startedAt: new Date() },
    });

    this.logger.log(`[ProposalJob ${proposalId}] Start — ${prospect.nombreEmpresa} | type:${proposalType} | market:${marketProfile}`);

    try {
      const prompt = proposalType === 'OUTREACH'
        ? this.buildOutreachPrompt(prospect, marketProfile)
        : this.buildCommercialPrompt(prospect, catalog, marketProfile);

      const raw = await this.spawnClaude(prompt, 'claude-sonnet-4-6', 120_000);
      const data = this.parseAgentOutput(raw);
      const markdown = proposalType === 'OUTREACH'
        ? this.toOutreachMarkdown(data as OutreachBriefData, prospect)
        : this.toCommercialMarkdown(data as CommercialProposalData, prospect);

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

  // ── Outreach Brief Prompt ─────────────────────────────────────────────────────

  private buildOutreachPrompt(prospect: any, marketProfile: string): string {
    const v = prospect.validation;
    const e = prospect.enrichmentResult;
    const market = MARKET_CONFIG[marketProfile] ?? MARKET_CONFIG['ARGENTINA'];
    const industryKey = detectIndustryProfile(prospect.rubro);
    const industry = INDUSTRY_CONFIG[industryKey];

    return `Sos un especialista en prospección B2B para agencias de marketing digital en ${marketProfile}.

CONTEXTO ESTRATÉGICO:
El objetivo NO es vender ni cerrar. Es conseguir UNA RESPUESTA del prospecto.
EL ANÁLISIS YA FUE REALIZADO. No ofrecer "hacer un diagnóstico" — ya está hecho.
El CTA debe asumir que el análisis existe e invitar a RECIBIRLO.
Estrategia de mercado: ${market.strategy}
Industria: ${industryKey} — Focos: ${industry.focos.join(', ')}
Tono: ${industry.tone}

DATOS DEL PROSPECTO:
- Empresa: ${prospect.nombreEmpresa}
- Rubro: ${prospect.rubro ?? 'No especificado'}
- País/Ciudad: ${[prospect.ciudad, prospect.pais].filter(Boolean).join(', ') || 'No especificado'}
- Website: ${prospect.website ?? 'Sin web'}

OPORTUNIDAD DETECTADA:
${prospect.oportunidadDetectada ?? 'No especificada'}

PROBLEMAS IDENTIFICADOS:
${(prospect.problemasEncontrados ?? []).map((p: string) => `- ${p}`).join('\n') || '- No especificados'}

EVALUACIÓN:
- Score: ${v?.agentScore ?? 'N/A'} / 100
- Servicios potenciales: ${v?.servicesRecommended?.join(', ') ?? prospect.servicioSugerido ?? 'N/A'}
- Razonamiento del agente: ${v?.reasoning ?? 'No disponible'}

DATOS DE CONTACTABILIDAD:
- Score: ${e?.contactabilityScore ?? 'N/A'} / 100
- Decisor: ${e?.nombreDecidsor ?? 'No identificado'}${e?.rolDecidsor ? ` (${e.rolDecidsor})` : ''}

INSTRUCCIONES CRÍTICAS:
1. NO mostrar precios ni inversiones
2. NO pedir logo, manual de marca, historia corporativa ni material de branding
3. NO proponer reunión en el primer mensaje
4. CTA válido: "Si te interesa, podemos compartirte el detalle completo." / "¿Te gustaría recibir el informe?" / "Podemos enviarte el análisis completo."
5. CTA INVÁLIDO: "Agendemos una llamada" / "¿Tenés 30 minutos?" / "¿Te gustaría que hagamos un diagnóstico?" (ya fue hecho)
6. Referencia para el CTA de esta industria: ${industry.ctaFraming}

analysisType — elegir uno:
- OPPORTUNITY: los problemas son principalmente brechas de crecimiento (SEO, e-commerce, alcance)
- RISK: hay problemas críticos de confianza/seguridad (SSL vencido, web caída, reputación dañada)
- MIXED: combina ambos

outreachMessage — mensaje corto (150-250 palabras) listo para enviar por WhatsApp/Email/DM:
- Párrafo 1: qué encontramos (problema o oportunidad principal, específico a esta empresa)
- Párrafo 2: impacto en el negocio
- Párrafo 3: qué tenemos para compartir
- CTA final (una línea)
- Tono: consultor que ya analizó el negocio, NO vendedor de agencia

Respondé SOLO con JSON válido:

{
  "proposalType": "OUTREACH",
  "analysisType": "OPPORTUNITY" | "RISK" | "MIXED",
  "industryProfile": "${industryKey}",
  "diagnosticoResumen": "string — 3-4 oraciones sobre la situación actual y potencial detectado. Tono consultivo.",
  "problemasDetectados": [
    {"problema": "string — problema concreto", "impacto": "string — impacto en el negocio"}
  ],
  "oportunidades": [
    {"oportunidad": "string — oportunidad específica", "beneficio": "string — beneficio concreto"}
  ],
  "riesgos": ["string — riesgo de no actuar"],
  "recomendacionesGenerales": ["string — sin precios ni servicios específicos"],
  "cta": "string — invitación a recibir el análisis ya realizado. Usar como referencia: ${industry.ctaFraming.replace(/"/g, '\\"')}",
  "outreachMessage": "string — 150-250 palabras. Listo para enviar por WhatsApp o email. Problema + Impacto + Oportunidad + CTA. Sin listas, sin asteriscos, prosa directa."
}`;
  }

  // ── Commercial Proposal Prompt ────────────────────────────────────────────────

  private buildCommercialPrompt(prospect: any, catalog: any[], marketProfile: string): string {
    const v = prospect.validation;
    const e = prospect.enrichmentResult;
    const market = MARKET_CONFIG[marketProfile] ?? MARKET_CONFIG['ARGENTINA'];
    const isHighValueMarket = ['USA', 'CANADA', 'EUROPE'].includes(marketProfile);

    const catalogLines = catalog.length
      ? catalog.map(c => `- ${c.nombre}: USD ${Number(c.precioBaseUsd)} (${c.billingModelDefault}) — ${c.descripcionDefault ?? ''}`).join('\n')
      : 'Sin items en catálogo — usá precios de referencia del mercado';

    const pricingInstructions = isHighValueMarket
      ? `Usá los precios EXACTOS del catálogo. Podés mostrar inversión total.`
      : `NO uses precios exactos del catálogo. Usá RANGOS: Esencial ${market.esencialRange}, Crecimiento ${market.crecimientoRange}, Completo ${market.completoRange}. ${market.avoidAnnualTotal ? 'NO mostrar total anual.' : ''}`;

    return `Sos un consultor estratégico digital especializado para el mercado ${marketProfile}. Tu tarea es generar una propuesta comercial estructurada.

IMPORTANTE: Esta propuesta se genera DESPUÉS de que el prospecto mostró interés. Es el segundo contacto.
Estrategia de mercado: ${market.strategy}

DATOS DEL PROSPECTO:
- Empresa: ${prospect.nombreEmpresa}
- Rubro: ${prospect.rubro ?? 'No especificado'}
- País/Ciudad: ${[prospect.ciudad, prospect.pais].filter(Boolean).join(', ') || 'No especificado'}
- Website: ${prospect.website ?? 'Sin web'}

OPORTUNIDAD:
${prospect.oportunidadDetectada ?? 'No especificada'}

PROBLEMAS IDENTIFICADOS:
${(prospect.problemasEncontrados ?? []).map((p: string) => `- ${p}`).join('\n') || '- No especificados'}

EVALUACIÓN DE OPORTUNIDAD:
- Score: ${v?.agentScore ?? 'N/A'} / 100
- Ticket estimado: USD ${v?.estimatedTicketUsd ?? 'N/A'}
- Servicios recomendados: ${v?.servicesRecommended?.join(', ') ?? prospect.servicioSugerido ?? 'N/A'}
- Razonamiento: ${v?.reasoning ?? 'No disponible'}

CATÁLOGO DE SERVICIOS:
${catalogLines}

INSTRUCCIONES DE PRICING:
${pricingInstructions}

INSTRUCCIONES GENERALES:
1. Construir SIEMPRE tres paquetes: Esencial, Crecimiento (destacado), Completo
2. Esencial: resolver el problema principal con menor inversión
3. Crecimiento: balance costo-beneficio — DEBE ser la opción destacada
4. Completo: máximo impacto, todos los servicios relevantes
${!isHighValueMarket ? '5. Incluir 2-3 preguntas de calificación para el siguiente contacto (ej: "¿Actualmente trabajan con alguien de marketing?")' : ''}
6. Respondé SOLO con JSON válido

{
  "proposalType": "COMMERCIAL",
  "resumenEjecutivo": "string — 2-3 oraciones sobre la oportunidad",
  "diagnostico": "string — situación actual, problemas, impacto en el negocio",
  "problemasDetectados": [{"problema": "string", "impacto": "string"}],
  "objetivos": ["string"],
  "paquetes": [
    {
      "nombre": "Esencial",
      "descripcion": "string — qué problema resuelve este paquete",
      "incluye": ["string — servicio o entregable incluido"],
      ${isHighValueMarket ? '"pricing": {"setup": number, "mensual": number},' : `"ticketRange": "string — rango como '${market.esencialRange}'",`}
      "destacado": false
    },
    {
      "nombre": "Crecimiento",
      "descripcion": "string",
      "incluye": ["string"],
      ${isHighValueMarket ? '"pricing": {"setup": number, "mensual": number},' : `"ticketRange": "string — rango como '${market.crecimientoRange}'",`}
      "destacado": true
    },
    {
      "nombre": "Completo",
      "descripcion": "string",
      "incluye": ["string"],
      ${isHighValueMarket ? '"pricing": {"setup": number, "mensual": number},' : `"ticketRange": "string — rango como '${market.completoRange}'",`}
      "destacado": false
    }
  ],
  "paqueteRecomendado": "Crecimiento",
  ${!isHighValueMarket ? '"preguntasCalificacion": ["string — máximo 3 preguntas breves para calificar al prospecto"],' : ''}
  "justificacion": "string — por qué esta propuesta es la correcta para esta empresa",
  "cta": "string — próximo paso concreto"
}`;
  }

  // ── Parser ─────────────────────────────────────────────────────────────────────

  private parseAgentOutput(raw: string): ProposalData {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      this.logger.warn('ProposalAgent: no JSON found in output');
      const empty: OutreachBriefData = { proposalType: 'OUTREACH', analysisType: 'MIXED', industryProfile: 'GENERIC', diagnosticoResumen: '', problemasDetectados: [], oportunidades: [], riesgos: [], recomendacionesGenerales: [], cta: '', outreachMessage: '' };
      return empty;
    }
    try {
      return JSON.parse(jsonMatch[0]) as ProposalData;
    } catch {
      this.logger.warn('ProposalAgent: JSON parse error');
      const empty: OutreachBriefData = { proposalType: 'OUTREACH', analysisType: 'MIXED', industryProfile: 'GENERIC', diagnosticoResumen: '', problemasDetectados: [], oportunidades: [], riesgos: [], recomendacionesGenerales: [], cta: '', outreachMessage: '' };
      return empty;
    }
  }

  // ── Markdown renderers ────────────────────────────────────────────────────────

  private toOutreachMarkdown(data: OutreachBriefData, prospect: any): string {
    const lines: string[] = [];
    const typeLabel = data.analysisType === 'RISK' ? '⚠ RISK' : data.analysisType === 'OPPORTUNITY' ? '🚀 OPPORTUNITY' : '⚡ MIXED';
    lines.push(`# Outreach Brief — ${prospect.nombreEmpresa} [${typeLabel}]`);
    lines.push('');

    if (data.outreachMessage) {
      lines.push('## Mensaje Outreach (WhatsApp / Email / DM)');
      lines.push('');
      lines.push(data.outreachMessage);
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    if (data.diagnosticoResumen) {
      lines.push('## Diagnóstico Interno');
      lines.push(data.diagnosticoResumen);
      lines.push('');
    }

    if (data.problemasDetectados?.length) {
      lines.push('## Problemas Detectados');
      data.problemasDetectados.forEach(p => {
        lines.push(`**${p.problema}**`);
        lines.push(`_${p.impacto}_`);
        lines.push('');
      });
    }

    if (data.oportunidades?.length) {
      lines.push('## Oportunidades');
      data.oportunidades.forEach(o => {
        lines.push(`**${o.oportunidad}**`);
        lines.push(`_${o.beneficio}_`);
        lines.push('');
      });
    }

    if (data.riesgos?.length) {
      lines.push('## Riesgos de No Actuar');
      data.riesgos.forEach(r => lines.push(`- ${r}`));
      lines.push('');
    }

    if (data.recomendacionesGenerales?.length) {
      lines.push('## Recomendaciones');
      data.recomendacionesGenerales.forEach(r => lines.push(`- ${r}`));
      lines.push('');
    }

    if (data.cta) {
      lines.push('## CTA');
      lines.push(data.cta);
    }

    return lines.join('\n');
  }

  private toCommercialMarkdown(data: CommercialProposalData, prospect: any): string {
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
        lines.push(`_${p.impacto}_`);
        lines.push('');
      });
    }

    if (data.objetivos?.length) {
      lines.push('## Objetivos');
      data.objetivos.forEach(o => lines.push(`- ${o}`));
      lines.push('');
    }

    if (data.paquetes?.length) {
      lines.push('## Planes');
      lines.push('');
      data.paquetes.forEach(pkg => {
        const star = pkg.destacado ? ' ⭐ (Recomendado)' : '';
        lines.push(`### Plan ${pkg.nombre}${star}`);
        lines.push(pkg.descripcion);
        if (pkg.incluye?.length) {
          lines.push('');
          lines.push('**Incluye:**');
          pkg.incluye.forEach(i => lines.push(`- ${i}`));
        }
        if (pkg.ticketRange) lines.push(`\n_Inversión referencial: ${pkg.ticketRange}_`);
        if (pkg.pricing) {
          if (pkg.pricing.setup) lines.push(`\n_Setup: USD ${pkg.pricing.setup}_`);
          if (pkg.pricing.mensual) lines.push(`_Fee mensual: USD ${pkg.pricing.mensual}_`);
        }
        lines.push('');
      });
    }

    if (data.preguntasCalificacion?.length) {
      lines.push('## Preguntas para el Próximo Contacto');
      data.preguntasCalificacion.forEach(q => lines.push(`- ${q}`));
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

  // ── Claude spawner ────────────────────────────────────────────────────────────

  private spawnClaude(prompt: string, model: string, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = [
        '-p', prompt,
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
