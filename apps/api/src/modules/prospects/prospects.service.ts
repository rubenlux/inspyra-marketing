import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ProspectEstado, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';
import { FilterProspectsDto } from './dto/filter-prospects.dto';
import { paginate, buildMeta } from '../../common/dto/pagination.dto';
import { spawn } from 'child_process';
import * as path from 'path';

// Valid state transitions — a prospect can never be orphaned
const VALID_TRANSITIONS: Record<ProspectEstado, ProspectEstado[]> = {
  NUEVO: ['INVESTIGADO', 'DESCARTADO', 'ARCHIVADO'],
  INVESTIGADO: ['ENRIQUECIDO', 'DESCARTADO', 'ARCHIVADO'],
  ENRIQUECIDO: ['LISTO_PROPUESTA', 'DESCARTADO', 'ARCHIVADO'],
  LISTO_PROPUESTA: ['LISTO_OUTREACH', 'DESCARTADO', 'ARCHIVADO'],
  LISTO_OUTREACH: ['CONTACTADO', 'DESCARTADO', 'ARCHIVADO'],
  CONTACTADO: ['RESPONDIO', 'DESCARTADO', 'ARCHIVADO'],
  RESPONDIO: ['INTERESADO', 'REUNION_AGENDADA', 'PASO_A_PIPELINE', 'DESCARTADO', 'ARCHIVADO'],
  INTERESADO: ['REUNION_AGENDADA', 'PASO_A_PIPELINE', 'DESCARTADO', 'ARCHIVADO'],
  REUNION_AGENDADA: ['PASO_A_PIPELINE', 'DESCARTADO', 'ARCHIVADO'],
  PASO_A_PIPELINE: ['CONVERTIDO', 'DESCARTADO', 'ARCHIVADO'],
  CONVERTIDO: [],
  DESCARTADO: ['ARCHIVADO'],
  ARCHIVADO: ['NUEVO'],
};

// Priority Score = scaled Pain (0-70) + Business Value (0-20) + Contactability (0-10) = 0-100
function computePriorityScore(p: {
  score: number;
  commercialScore?: number | null;
  email?: string | null;
  telefono?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
  facebook?: string | null;
}): number {
  const pain = Math.round(p.score * 0.7);
  const bvs = p.commercialScore ?? 0;
  let contact = 0;
  if (p.email) contact += 4;
  if (p.telefono) contact += 3;
  if (p.linkedin) contact += 2;
  if (p.instagram || p.facebook) contact += 1;
  return Math.min(100, pain + bvs + Math.min(10, contact));
}

export interface DiscoveredCompany {
  nombreEmpresa: string;
  website: string | null;
  instagram: string | null;
  telefono: string | null;
  email: string | null;
  googleBusiness: string | null;
  ciudad: string | null;
  rubro: string | null;
  descripcion: string | null;
}

export interface MapSearchResult {
  sourceMode: 'DISCOVERY';
  sourceType: 'GOOGLE_MAPS_SEARCH';
  url: string;
  query: string | null;
  companies: DiscoveredCompany[];
  total: number;
}

export interface ServiceScore {
  servicio: string;
  score: number;
  razon: string;
}

export interface CommercialAnalysis {
  sourceMode: 'COMPANY_AUDIT';
  sourceType: string;
  url: string;
  empresa: string | null;
  website: string | null;
  instagram: string | null;
  linkedin: string | null;
  facebook: string | null;
  googleBusiness: string | null;
  ciudad: string | null;
  rubro: string | null;
  descripcion: string | null;
  oportunidades: ServiceScore[];
  ticketEstimado: number;
  prioridad: string;
  oportunidadDetectada: string | null;
}

@Injectable()
export class ProspectsService {
  private readonly logger = new Logger(ProspectsService.name);
  private readonly projectRoot = path.resolve(__dirname, '../../../../../');

  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, filters: FilterProspectsDto) {
    const { page = 1, limit = 20, search, scoreMin, scoreMax, sortBy, ...rest } = filters;
    const { skip, take } = paginate(page, limit);

    const where: Prisma.ProspectWhereInput = {
      tenantId,
      deletedAt: null,
      isLegacy: false,
      ...this.buildFilters(rest),
    };

    if (search) {
      where.OR = [
        { nombreEmpresa: { contains: search, mode: 'insensitive' } },
        { nombreContacto: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { ciudad: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (scoreMin !== undefined || scoreMax !== undefined) {
      where.score = {};
      if (scoreMin !== undefined) where.score.gte = scoreMin;
      if (scoreMax !== undefined) where.score.lte = scoreMax;
    }

    const [data, total] = await Promise.all([
      this.prisma.prospect.findMany({
        where,
        skip,
        take,
        orderBy: sortBy === 'createdAt'
          ? [{ createdAt: 'desc' }]
          : [{ score: 'desc' }, { commercialScore: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
          validation: {
            select: {
              id: true, agentScore: true, humanScore: true, status: true, prioridad: true,
              estimatedTicketUsd: true, servicesRecommended: true,
              decisionFactors: true, validationVersion: true, reasoning: true,
              validatedAt: true, notes: true,
              feedback: { select: { rejectionReason: true, notes: true } },
            },
          },
        },
      }),
      this.prisma.prospect.count({ where }),
    ]);

    return {
      data: data.map(p => ({ ...p, priorityScore: computePriorityScore(p) })),
      meta: buildMeta(total, page, limit),
    };
  }

  async getKpis(tenantId: string) {
    const [
      total,
      nuevosEstaSemana,
      sinWeb,
      oportunidadAlta,
      listosOutreach,
      enPipeline,
      scores,
    ] = await Promise.all([
      this.prisma.prospect.count({ where: { tenantId, deletedAt: null, isLegacy: false } }),
      this.prisma.prospect.count({
        where: {
          tenantId,
          deletedAt: null,
          isLegacy: false,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.prospect.count({ where: { tenantId, deletedAt: null, isLegacy: false, website: null } }),
      this.prisma.prospect.count({ where: { tenantId, deletedAt: null, isLegacy: false, score: { gte: 80 } } }),
      this.prisma.prospect.count({
        where: { tenantId, deletedAt: null, isLegacy: false, estado: 'LISTO_OUTREACH' },
      }),
      this.prisma.prospect.count({
        where: { tenantId, deletedAt: null, isLegacy: false, estado: { in: ['PASO_A_PIPELINE', 'CONVERTIDO'] } },
      }),
      this.prisma.prospect.aggregate({
        where: { tenantId, deletedAt: null, isLegacy: false },
        _avg: { score: true },
      }),
    ]);

    return {
      total,
      nuevosEstaSemana,
      sinWeb,
      oportunidadAlta,
      listosOutreach,
      enPipeline,
      scorePromedio: Math.round(scores._avg.score || 0),
    };
  }

  async findOne(id: string, tenantId: string) {
    const prospect = await this.prisma.prospect.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        creadoPor: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!prospect) throw new NotFoundException('Prospect not found');
    return { ...prospect, priorityScore: computePriorityScore(prospect) };
  }

  async create(tenantId: string, userId: string | null, dto: CreateProspectDto) {
    return this.prisma.prospect.create({
      data: {
        tenantId,
        creadoPorId: userId ?? null,
        ...dto,
        problemasEncontrados: dto.problemasEncontrados || [],
      },
    });
  }

  async bulkCreate(
    tenantId: string,
    userId: string | null,
    dtos: CreateProspectDto[],
  ): Promise<{ created: number; duplicates: number; errors: { row: number; error: string }[] }> {
    const results = { created: 0, duplicates: 0, errors: [] as { row: number; error: string }[] };
    for (let i = 0; i < dtos.length; i++) {
      const dto = dtos[i];
      if (!dto.nombreEmpresa?.trim()) {
        results.errors.push({ row: i + 1, error: 'nombreEmpresa es requerido' });
        continue;
      }
      try {
        const existing = await this.prisma.prospect.findFirst({
          where: { tenantId, deletedAt: null, nombreEmpresa: { equals: dto.nombreEmpresa.trim(), mode: 'insensitive' } },
        });
        if (existing) { results.duplicates++; continue; }
        await this.prisma.prospect.create({
          data: {
            tenantId,
            creadoPorId: userId,
            ...dto,
            nombreEmpresa: dto.nombreEmpresa.trim(),
            fuente: dto.fuente ?? 'CSV_IMPORT',
            detectadoPor: dto.detectadoPor ?? 'MANUAL',
            score: dto.score ?? 0,
            problemasEncontrados: dto.problemasEncontrados ?? [],
          },
        });
        results.created++;
      } catch (e: any) {
        results.errors.push({ row: i + 1, error: e?.message ?? 'Error desconocido' });
      }
    }
    return results;
  }

  async extractFromUrl(url: string): Promise<CommercialAnalysis | MapSearchResult> {
    const sourceType = this.detectSourceType(url);
    if (sourceType === 'GOOGLE_MAPS_SEARCH') {
      return this.mapsSearchDiscovery(url);
    }
    return this.commercialAnalysis(url);
  }

  async mapsSearchDiscovery(url: string): Promise<MapSearchResult> {
    const queryMatch = url.match(/maps\/search\/([^?@/]+)/);
    const rawQuery = queryMatch ? decodeURIComponent(queryMatch[1].replace(/\+/g, ' ')) : null;

    const prompt = `Sos un agente de extracción de datos de Google Maps para Inspyra Digital, agencia argentina de servicios digitales.

Se te dio esta URL de búsqueda de Google Maps:
${url}

TU TAREA:
1. Accedé a la URL con WebFetch
2. Extraé TODAS las empresas/negocios que aparezcan en los resultados de búsqueda
3. Para cada negocio encontrado, conseguí: nombre, website, instagram, teléfono, categoría/rubro, ciudad
4. Si el WebFetch de la URL de Maps no retorna resultados útiles, extraé el término de búsqueda de la URL y usá WebSearch para encontrar los negocios en esa categoría y zona

REGLAS:
- Listá entre 5 y 20 negocios reales encontrados en los resultados
- No inventes datos — si no encontraste un campo, usá null
- googleBusiness = URL específica de ese negocio en Google Maps (si podés extraerla), si no null
- El campo "descripcion" es opcional (máximo 1 oración)

Respondé ÚNICAMENTE con JSON puro (sin texto adicional, sin markdown, sin bloques de código):
{
  "query": "término o descripción de búsqueda que usaste",
  "companies": [
    {
      "nombreEmpresa": "Nombre real del negocio",
      "website": "https://... o null",
      "instagram": "https://instagram.com/handle o null",
      "telefono": "+54... o null",
      "email": null,
      "googleBusiness": "https://maps.google.com/... o null",
      "ciudad": "Ciudad, País",
      "rubro": "Categoría del negocio",
      "descripcion": "Descripción breve o null"
    }
  ]
}`;

    const raw = await this.spawnClaudeAgentic(prompt, 'claude-sonnet-4-6', 60_000, 300_000);

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      this.logger.warn(`[mapsSearchDiscovery] No JSON. Output: ${raw.slice(0, 300)}`);
      throw new Error('El agente no encontró empresas en la búsqueda');
    }

    try {
      const parsed = JSON.parse(match[0]);
      const companies: DiscoveredCompany[] = (parsed.companies ?? []).filter(
        (c: DiscoveredCompany) => c.nombreEmpresa,
      );
      return {
        sourceMode: 'DISCOVERY',
        sourceType: 'GOOGLE_MAPS_SEARCH',
        url,
        query: parsed.query ?? rawQuery,
        companies,
        total: companies.length,
      };
    } catch (e) {
      throw new Error(`Error parseando resultados de Maps: ${(e as Error).message}`);
    }
  }

  async commercialAnalysis(url: string): Promise<CommercialAnalysis> {
    const sourceType = this.detectSourceType(url);
    const sourceDesc: Record<string, string> = {
      GOOGLE_MAPS_PLACE: 'Ficha de Google Maps / Google Business Profile',
      INSTAGRAM: 'Perfil de Instagram',
      LINKEDIN: 'Página de LinkedIn',
      FACEBOOK: 'Página de Facebook',
      TIKTOK: 'Perfil de TikTok',
      YOUTUBE: 'Canal de YouTube',
      X: 'Perfil de X / Twitter',
      WEBSITE: 'Sitio web',
    };

    const prompt = `Sos el Analista Comercial Senior de INSPYRA Digital.

INSPYRA es una agencia de servicios digitales para pymes latinoamericanas. Nuestro catálogo completo:
- Sitio Web Nuevo: desarrollo de sitio web desde cero
- Rediseño Web: modernización de sitio web existente
- SEO Local: posicionamiento en Google para búsquedas locales
- SEO Técnico: optimización técnica de sitio web
- Google Business: configuración y optimización de ficha GBP
- Software / CRM: sistema de gestión a medida
- WhatsApp Automation: chatbot y automatización de consultas
- Landing Pages: páginas de conversión para campañas
- Hosting VPS: alojamiento web profesional administrado
- Redes Sociales: gestión de contenido y comunidad
- Email Marketing: campañas de email a base de clientes

URL DE ORIGEN: ${url}
TIPO DE FUENTE: ${sourceType} — ${sourceDesc[sourceType] ?? 'URL web'}

TU MISIÓN:
1. Visitá la URL proporcionada con WebFetch
2. Si es red social o Google Maps, buscá también el sitio web real de la empresa
3. Investigá su presencia digital: web, redes, GBP, velocidad aparente, etc.
4. Para CADA servicio del catálogo, asigná un score 0-100 basado en evidencia observada:
   - 0-30: Ya lo tienen bien resuelto (sin oportunidad)
   - 31-60: Oportunidad moderada
   - 61-85: Buena oportunidad
   - 86-100: Oportunidad urgente / crítica

CRITERIOS DE SCORING POR SERVICIO:
- Sitio Web Nuevo → 90+ si NO tienen web propia, 0-20 si tienen buena web
- Rediseño Web → 70+ si web existe pero está desactualizada/lenta/anticuada, 0 si no tienen web
- SEO Local → 85+ si no aparecen en búsquedas locales para sus keywords, 20- si ya rankean bien
- SEO Técnico → 70+ si web con problemas técnicos visibles (lenta, sin HTTPS, sin schema)
- Google Business → 90+ si sin ficha GBP o ficha no verificada/incompleta, 5- si la tienen perfecta
- Software / CRM → 65+ si empresa mediana con procesos manuales evidentes
- WhatsApp Automation → 65+ si negocio con alto volumen de consultas (restaurante, salud, legal, inmobiliaria)
- Landing Pages → 65+ si tienen servicios diferenciados o hacen publicidad paga visible
- Hosting VPS → 55+ si web en hosting lento o compartido evidente, 10- si infraestructura propia
- Redes Sociales → 88+ si sin redes o redes muy inactivas (<1 post/mes), 0-20 si muy activas y bien gestionadas
- Email Marketing → 60+ si empresa con base de clientes recurrente pero sin newsletter visible

TICKET ESTIMADO: calculá precio total en USD de los TOP 3 servicios (score más alto). Rangos orientativos:
- Sitio Web Nuevo: $800-2500 | Rediseño: $600-2000 | SEO Local: $300-800/mes | SEO Técnico: $500-1500
- Google Business: $150-400 | Software/CRM: $2000-8000 | WhatsApp Auto: $400-1200
- Landing Pages: $500-1500 | Hosting VPS: $100-300/mes | Redes Sociales: $400-1000/mes | Email Marketing: $200-600

PRIORIDAD:
- ALTA: ticketEstimado > $1500 Y al menos un servicio con score >= 80
- MEDIA: ticketEstimado entre $500 y $1500, o sin servicio con score >= 80
- BAJA: ticketEstimado < $500 o todos los scores < 50

IMPORTANTE: Respondé ÚNICAMENTE con JSON puro. Sin texto adicional, sin markdown, sin bloques de código:
{
  "empresa": "nombre real y completo de la empresa",
  "website": "https://sitio-real.com o null si no tienen",
  "instagram": "https://instagram.com/handle o null",
  "linkedin": "https://linkedin.com/company/slug o null",
  "facebook": "https://facebook.com/page o null",
  "googleBusiness": "URL de Google Maps si encontraste la ficha, si no null",
  "ciudad": "Ciudad, País",
  "rubro": "rubro específico y descriptivo",
  "descripcion": "Descripción factual de la empresa en 2-3 oraciones basada en lo que observaste.",
  "oportunidades": [
    { "servicio": "Sitio Web Nuevo", "score": 92, "razon": "No tienen sitio web propio" },
    { "servicio": "Rediseño Web", "score": 0, "razon": "No aplica — sin web actual" },
    { "servicio": "SEO Local", "score": 88, "razon": "Sin posicionamiento en Google local" },
    { "servicio": "SEO Técnico", "score": 10, "razon": "Sin web — no aplica" },
    { "servicio": "Google Business", "score": 95, "razon": "Sin ficha GBP activa" },
    { "servicio": "Software / CRM", "score": 50, "razon": "Tamaño sugiere procesos semi-manuales" },
    { "servicio": "WhatsApp Automation", "score": 72, "razon": "Alto volumen de consultas en redes" },
    { "servicio": "Landing Pages", "score": 45, "razon": "Sin publicidad activa evidente" },
    { "servicio": "Hosting VPS", "score": 5, "razon": "Sin web — no aplica" },
    { "servicio": "Redes Sociales", "score": 25, "razon": "Instagram activo con buen contenido" },
    { "servicio": "Email Marketing", "score": 40, "razon": "Base de clientes aún reducida" }
  ],
  "ticketEstimado": 2100,
  "prioridad": "ALTA",
  "oportunidadDetectada": "Resumen ejecutivo de la oportunidad principal en 2-3 oraciones. ¿Qué haría Inspyra con esta empresa? ¿Cuál es el ángulo de entrada?"
}`;

    const raw = await this.spawnClaudeAgentic(prompt, 'claude-sonnet-4-6', 60_000, 300_000);

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      this.logger.warn(`[commercialAnalysis] No JSON. Output: ${raw.slice(0, 300)}`);
      throw new Error('El agente no devolvió un análisis válido');
    }

    try {
      const parsed = JSON.parse(match[0]);
      return { sourceMode: 'COMPANY_AUDIT', sourceType, url, ...parsed } as CommercialAnalysis;
    } catch (e) {
      throw new Error(`Error parseando análisis comercial: ${(e as Error).message}`);
    }
  }

  private detectSourceType(url: string): string {
    if (/google\.com\/maps\/search|maps\.google\.com\/maps\/search/.test(url)) return 'GOOGLE_MAPS_SEARCH';
    if (/google\.com\/maps\/place|maps\.google\.com\/maps\/place|maps\.google\.com\/@/.test(url)) return 'GOOGLE_MAPS_PLACE';
    if (/maps\.google\.com|google\.com\/maps/.test(url)) return 'GOOGLE_MAPS_PLACE';
    if (/instagram\.com/.test(url)) return 'INSTAGRAM';
    if (/linkedin\.com/.test(url)) return 'LINKEDIN';
    if (/facebook\.com|fb\.com/.test(url)) return 'FACEBOOK';
    if (/tiktok\.com/.test(url)) return 'TIKTOK';
    if (/youtube\.com|youtu\.be/.test(url)) return 'YOUTUBE';
    if (/twitter\.com|x\.com/.test(url)) return 'X';
    return 'WEBSITE';
  }

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
      this.logger.log(`[commercialAnalysis] Spawning ${model} | idle: ${idleTimeoutMs / 1000}s | total: ${totalTimeoutMs / 1000}s`);

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
        done(new Error(`Timeout total ${model} after ${totalTimeoutMs / 60000}min`));
      }, totalTimeoutMs);

      let idleTimer = setTimeout(() => {
        child.kill('SIGTERM');
        done(new Error(`Idle timeout ${model}: sin output por ${idleTimeoutMs / 1000}s`));
      }, idleTimeoutMs);

      child.stdout.on('data', (chunk: Buffer) => {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          child.kill('SIGTERM');
          done(new Error(`Idle timeout ${model}: sin output por ${idleTimeoutMs / 1000}s`));
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
                done(new Error(`claude error: ${JSON.stringify(event).slice(0, 200)}`));
              }
            }
          } catch { /* partial line */ }
        }
      });

      child.stderr.on('data', (c: Buffer) => { stderr += c.toString(); });
      child.on('close', code => {
        if (code !== 0 && !settled) {
          done(new Error(`claude exited ${code}. stderr: ${stderr.slice(-400)}`));
        }
      });
      child.on('error', (e) => done(e));
    });
  }

  async update(id: string, tenantId: string, dto: UpdateProspectDto) {
    const prospect = await this.findOne(id, tenantId);

    if (dto.estado && dto.estado !== prospect.estado) {
      const allowed = VALID_TRANSITIONS[prospect.estado];
      if (!allowed.includes(dto.estado)) {
        throw new BadRequestException(
          `Cannot transition from ${prospect.estado} to ${dto.estado}`,
        );
      }
    }

    return this.prisma.prospect.update({
      where: { id },
      data: dto,
    });
  }

  async archive(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.prospect.update({
      where: { id },
      data: { estado: 'ARCHIVADO' },
    });
  }

  async discard(id: string, tenantId: string, motivo: string) {
    await this.findOne(id, tenantId);
    return this.prisma.prospect.update({
      where: { id },
      data: { estado: 'DESCARTADO', oportunidadDetectada: motivo },
    });
  }

  async softDelete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.prospect.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private buildFilters(filters: Partial<FilterProspectsDto>) {
    const where: Prisma.ProspectWhereInput = {};
    if (filters.rubro) where.rubro = { contains: filters.rubro, mode: 'insensitive' };
    if (filters.pais) where.pais = filters.pais;
    if (filters.ciudad) where.ciudad = { contains: filters.ciudad, mode: 'insensitive' };
    if (filters.estado) where.estado = filters.estado;
    if (filters.ownerId) where.ownerId = filters.ownerId;
    if (filters.fuente) where.fuente = filters.fuente;
    if (filters.nivelOportunidad) where.nivelOportunidad = filters.nivelOportunidad;
    if (filters.detectadoPor) where.detectadoPor = filters.detectadoPor;
    return where;
  }
}
