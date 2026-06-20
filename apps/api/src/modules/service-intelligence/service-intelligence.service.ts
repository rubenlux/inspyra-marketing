import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SIR_CATALOG } from './catalog';

const PROBLEM_TO_SIR_ID: { pattern: RegExp; serviceId: string }[] = [
  { pattern: /sitemap|robots\.txt|indexac|rastreo|crawl/i,          serviceId: 'seo-technical' },
  { pattern: /schema|datos.?estructurados|json.?ld|structured/i,     serviceId: 'seo-schema' },
  { pattern: /seguridad|ssl\b|https\b|certificado|csp\b|hsts|vulnerab|hackeo/, serviceId: 'hostingguard' },
  { pattern: /responsive|móvil|mobile|pantalla.?chica/i,             serviceId: 'web-redesign' },
  { pattern: /instagram|redes.?sociales|social.?media/i,             serviceId: 'social-management' },
  { pattern: /whatsapp/i,                                            serviceId: 'whatsapp-setup' },
  { pattern: /perfil.?gbp|gbp.?sin.?reclamar|sin.?reclamar.?gbp|ficha.?sin.?reclamar/i, serviceId: 'gbp-management' },
  { pattern: /reseñas|reviews|google.?business/i,                    serviceId: 'review-management' },
  { pattern: /sin.?sitio|no.?web|sin.?página|no.?tiene.?web/i,      serviceId: 'web-new' },
  { pattern: /meta.?desc|title.?tag|h1\b|canonical\b/i,             serviceId: 'seo-technical' },
  { pattern: /velocidad|lento|carga.?lenta|performance|core.?web/i,  serviceId: 'seo-technical' },
  { pattern: /crm\b|leads?|oportunidades.?venta/i,                   serviceId: 'crm-setup' },
  { pattern: /turno|reserva|cita|booking/i,                          serviceId: 'booking-automation' },
  { pattern: /email.?market|newsletter|mailing/i,                    serviceId: 'email-automation' },
  { pattern: /facebook|meta.?ads|anunci/i,                           serviceId: 'meta-ads' },
  { pattern: /google.?maps|mapa|localiz/i,                           serviceId: 'gbp-management' },
  { pattern: /seo.?local|busqueda.?local|aparec.+ciudad/i,           serviceId: 'seo-local' },
];

export interface IntelResult {
  problema: string;
  impactoDescripcion: string;
  serviciosRecomendados: string[];
  prioridad: string;
  ticketEstimadoUsd: number;
  bundleSugerido: string | null;
}

@Injectable()
export class ServiceIntelligenceService {
  constructor(private readonly prisma: PrismaService) {}

  async analyze(tenantId: string, problemas: string[]): Promise<IntelResult[]> {
    const rules = await this.prisma.serviceIntelligenceRule.findMany({
      where: { tenantId, activo: true },
    });

    const results: IntelResult[] = [];

    for (const problema of problemas) {
      const lower = problema.toLowerCase();

      const matched = rules.filter((rule) =>
        rule.problemPattern
          .split(',')
          .map((p) => p.trim().toLowerCase())
          .some((pattern) => lower.includes(pattern)),
      );

      if (matched.length > 0) {
        // Take the highest-priority matching rule
        const best = matched.sort((a, b) => {
          const order = { CRITICA: 4, ALTA: 3, MEDIA: 2, BAJA: 1 };
          return (order[b.prioridad as keyof typeof order] ?? 0) - (order[a.prioridad as keyof typeof order] ?? 0);
        })[0];

        results.push({
          problema,
          impactoDescripcion: best.impactoDescripcion,
          serviciosRecomendados: best.serviciosRecomendados,
          prioridad: best.prioridad,
          ticketEstimadoUsd: Number(best.ticketEstimadoUsd),
          bundleSugerido: best.bundleSugerido,
        });
      } else {
        // No DB rule matched — fall back to SIR catalog via deterministic keyword map
        const sirServiceId = PROBLEM_TO_SIR_ID.find(({ pattern }) => pattern.test(lower))?.serviceId;
        const sirService = sirServiceId ? SIR_CATALOG.find((s) => s.id === sirServiceId) : null;
        results.push({
          problema,
          impactoDescripcion: sirService?.pitch ?? 'Problema detectado sin regla específica configurada',
          serviciosRecomendados: sirService ? [sirService.name] : [],
          prioridad: sirService ? 'ALTA' : 'MEDIA',
          ticketEstimadoUsd: sirService ? sirService.avgTicketUsd[0] : 0,
          bundleSugerido: null,
        });
      }
    }

    return results;
  }
}
