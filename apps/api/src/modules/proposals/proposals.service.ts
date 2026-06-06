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
  communicationLanguage: string;
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

// ── Communication language detection ────────────────────────────────────────

function detectCommunicationLanguage(prospect: any): string {
  if (prospect.communicationLanguage) return prospect.communicationLanguage as string;

  const website = (prospect.website ?? '').toLowerCase();
  const location = `${prospect.pais ?? ''} ${prospect.ciudad ?? ''}`.toLowerCase();

  // 1. Website TLD — strongest signal
  if (/\.fr(\/|$)/.test(website)) return 'FR';
  if (/\.de(\/|$)|\.at(\/|$)/.test(website)) return 'DE';
  if (/\.com\.br(\/|$)|\.br(\/|$)/.test(website)) return 'PT';
  if (/\.(ar|mx|co|cl|pe|es|uy|ec|py|bo|ve)(\/|$)/.test(website)) return 'ES';

  // 2. Country / city
  if (/\b(brazil|brasil)\b/.test(location)) return 'PT';
  if (/\b(france|paris|lyon|marseille|bordeaux)\b/.test(location)) return 'FR';
  if (/\b(germany|deutschland|austria|berlin|munich|münchen|wien|frankfurt)\b/.test(location)) return 'DE';
  if (/\b(united states|usa|u\.s\.|florida|california|texas|new york|new jersey|illinois|georgia|ohio|michigan|pennsylvania|miami|los angeles|chicago|houston|dallas|phoenix|denver|seattle|boston|atlanta)\b/.test(location)) return 'EN';
  if (/\b(canada|ontario|british columbia|alberta|québec|toronto|vancouver|calgary|ottawa|montreal)\b/.test(location)) return 'EN';
  if (/\b(uk|united kingdom|england|ireland|australia|new zealand|london|sydney|melbourne)\b/.test(location)) return 'EN';
  if (/\b(argentina|méxico|mexico|colombia|chile|perú|peru|españa|spain|uruguay|paraguay|bolivia|ecuador|venezuela|costa rica|panamá|panama|dominican|república dominicana)\b/.test(location)) return 'ES';

  return 'ES'; // default
}

const LANGUAGE_LABELS: Record<string, string> = {
  EN: 'English',
  ES: 'español',
  PT: 'português',
  FR: 'français',
  DE: 'Deutsch',
};

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

    // Detect communication language; persist on prospect if not yet set
    const communicationLanguage = detectCommunicationLanguage(prospect);
    if (!prospect.communicationLanguage) {
      await this.prisma.prospect.update({
        where: { id: prospectId },
        data: { communicationLanguage: communicationLanguage as any },
      });
    }

    // Load catalog only for COMMERCIAL proposals
    let catalog: any[] = [];
    if (proposalType === 'COMMERCIAL') {
      catalog = await this.prisma.serviceCatalogItem.findMany({
        where: { tenantId, activo: true },
        select: { nombre: true, descripcionDefault: true, precioBaseUsd: true, billingModelDefault: true, categoria: true },
      });
    }

    setImmediate(() =>
      this.runProposalAgent(proposal.id, tenantId, prospect, catalog, proposalType, marketProfile, communicationLanguage).catch(err =>
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
    communicationLanguage: string,
  ) {
    await this.prisma.proposal.update({
      where: { id: proposalId },
      data: { jobStatus: 'RUNNING', startedAt: new Date() },
    });

    this.logger.log(`[ProposalJob ${proposalId}] Start — ${prospect.nombreEmpresa} | type:${proposalType} | market:${marketProfile} | lang:${communicationLanguage}`);

    try {
      const prompt = proposalType === 'OUTREACH'
        ? this.buildOutreachPrompt(prospect, marketProfile, communicationLanguage)
        : this.buildCommercialPrompt(prospect, catalog, marketProfile, communicationLanguage);

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

  private buildOutreachPrompt(prospect: any, marketProfile: string, communicationLanguage: string): string {
    const v = prospect.validation;
    const e = prospect.enrichmentResult;
    const market = MARKET_CONFIG[marketProfile] ?? MARKET_CONFIG['ARGENTINA'];
    const industryKey = detectIndustryProfile(prospect.rubro);
    const industry = INDUSTRY_CONFIG[industryKey];
    const langLabel = LANGUAGE_LABELS[communicationLanguage] ?? communicationLanguage;
    const isEN = communicationLanguage === 'EN';

    return `You are a B2B outreach specialist for a digital marketing agency.
Your task: generate an Outreach Brief for a cold prospect.
GOAL: get ONE response. Not a sale. Not a meeting request.

MARKET: ${marketProfile} — ${market.strategy}
INDUSTRY: ${industryKey} — focus on: ${industry.focos.join(', ')}
TONE: ${industry.tone}

PROSPECT:
- Company: ${prospect.nombreEmpresa}
- Industry: ${prospect.rubro ?? 'Not specified'}
- Location: ${[prospect.ciudad, prospect.pais].filter(Boolean).join(', ') || 'Not specified'}
- Website: ${prospect.website ?? 'No website'}

DETECTED OPPORTUNITY:
${prospect.oportunidadDetectada ?? 'Not specified'}

IDENTIFIED PROBLEMS:
${(prospect.problemasEncontrados ?? []).map((p: string) => `- ${p}`).join('\n') || '- Not specified'}

QUALITY SCORE: ${v?.agentScore ?? 'N/A'} / 100
RECOMMENDED SERVICES: ${v?.servicesRecommended?.join(', ') ?? prospect.servicioSugerido ?? 'N/A'}
AGENT REASONING: ${v?.reasoning ?? 'Not available'}

DECISION MAKER: ${e?.nombreDecidsor ?? 'Not identified'}${e?.rolDecidsor ? ` (${e.rolDecidsor})` : ''}

═══ CRITICAL RULES ═══

TONE — HOW TO DESCRIBE THE ANALYSIS:
The analysis was performed using publicly available information (website, social media, Google).
NEVER write phrases like "we visited", "we reviewed a few days ago", "our team checked" — those sound like a human was personally involved.
CORRECT: "Reviewing publicly available information about [company]...", "Analyzing [company]'s digital presence...", "Based on publicly available data about [company]..."
This is important for credibility. The message should sound like an informed observer, not a stalker.

CTA — CRITICAL:
THE ANALYSIS IS ALREADY DONE. Never offer to "do a diagnosis" — it was already done.
Invite the prospect to RECEIVE the existing analysis.
VALID: "If you're interested, we can share the full details of what we found." / "Would you like to receive the complete report?" / "We can send you the full analysis."
INVALID: "Let's schedule a call" / "Do you have 30 minutes?" / "Would you like us to do a diagnosis?" (already done)
Industry reference for CTA: ${isEN ? industry.ctaFraming.replace(/podemos compartirte/g, 'we can share with you').replace(/encontramos/g, 'we found').replace(/te interesa/g, "you're interested") : industry.ctaFraming}

AVOID COPYWRITING LANGUAGE:
Do not write promotional phrases like "traffic and leads lost in silence", "missed opportunities accumulating daily", "your competitors are already doing this".
Stick to factual observations: "we found X", "this typically causes Y", "we can share more details".

NO prices, NO budgets, NO service lists with costs.
NO requests for logo, brand manual, corporate history.
NO meeting requests in first contact.

═══ OUTPUT FIELDS ═══

analysisType:
- OPPORTUNITY: mainly growth gaps (missing SEO, no e-commerce, unoptimized reach)
- RISK: critical trust/security issues (expired SSL, site down, unanswered negative reviews)
- MIXED: both

outreachMessage — LANGUAGE: MUST be written entirely in ${langLabel.toUpperCase()} (${communicationLanguage})
Format: short message (80-120 words MAX) ready to send via WhatsApp, email, or DM.
Structure:
- Line 1: greeting + company name
- Paragraph 1 (2-3 sentences): what we found — specific to this company, no generic marketing speak
- Paragraph 2 (1-2 sentences): why it matters for their business
- CTA (1 sentence): invite to receive the complete analysis
No bullet points. No asterisks. Plain prose.
${isEN ? '' : `IMPORTANT: the outreachMessage must be written in ${langLabel}, NOT in Spanish, even though this prompt is in English.`}

diagnosticoResumen (internal, can be in Spanish): 3-4 sentences about current situation and detected potential.

Respond ONLY with valid JSON:

{
  "proposalType": "OUTREACH",
  "analysisType": "OPPORTUNITY" | "RISK" | "MIXED",
  "industryProfile": "${industryKey}",
  "communicationLanguage": "${communicationLanguage}",
  "diagnosticoResumen": "string — internal analysis summary in Spanish",
  "problemasDetectados": [{"problema": "string", "impacto": "string"}],
  "oportunidades": [{"oportunidad": "string", "beneficio": "string"}],
  "riesgos": ["string"],
  "recomendacionesGenerales": ["string — no prices, no specific services"],
  "cta": "string — in ${langLabel}: invitation to receive the existing analysis",
  "outreachMessage": "string — 80-120 words in ${langLabel}. Plain prose, no lists."
}`;
  }

  // ── Commercial Proposal Prompt ────────────────────────────────────────────────

  private buildCommercialPrompt(prospect: any, catalog: any[], marketProfile: string, communicationLanguage: string): string {
    const langLabel = LANGUAGE_LABELS[communicationLanguage] ?? communicationLanguage;
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
IDIOMA: Todo el contenido visible al prospecto (cta, paquetes, descripciones) debe estar en ${langLabel} (${communicationLanguage}).
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
      const empty: OutreachBriefData = { proposalType: 'OUTREACH', analysisType: 'MIXED', industryProfile: 'GENERIC', communicationLanguage: 'ES', diagnosticoResumen: '', problemasDetectados: [], oportunidades: [], riesgos: [], recomendacionesGenerales: [], cta: '', outreachMessage: '' };
      return empty;
    }
    try {
      return JSON.parse(jsonMatch[0]) as ProposalData;
    } catch {
      this.logger.warn('ProposalAgent: JSON parse error');
      const empty: OutreachBriefData = { proposalType: 'OUTREACH', analysisType: 'MIXED', industryProfile: 'GENERIC', communicationLanguage: 'ES', diagnosticoResumen: '', problemasDetectados: [], oportunidades: [], riesgos: [], recomendacionesGenerales: [], cta: '', outreachMessage: '' };
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
