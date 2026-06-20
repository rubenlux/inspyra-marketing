// Service Match First — ERP-052
// El score deriva de hechos verificables, no de scores internos del SIR.
// Cada regla mapea un patrón de problema → servicio INSPYRA con tipo de encaje e impacto comercial.

export type MatchType = 'EXACT_MATCH' | 'STRONG_MATCH' | 'PARTIAL_MATCH' | 'WEAK_MATCH';
export type ImpactLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ProblemMatchRule {
  pattern: RegExp;
  serviceId: string;
  matchType: MatchType;
  businessImpact: ImpactLevel;
}

export interface ServiceMatchResult {
  serviceId: string;
  problema: string;
  matchType: MatchType;
  businessImpact: ImpactLevel;
}

export const MATCH_TYPE_SCORE: Record<MatchType, number> = {
  EXACT_MATCH:   40,
  STRONG_MATCH:  30,
  PARTIAL_MATCH: 20,
  WEAK_MATCH:    10,
};

export const IMPACT_SCORE: Record<ImpactLevel, number> = {
  CRITICAL: 40,
  HIGH:     30,
  MEDIUM:   20,
  LOW:      10,
};

// Orden: las reglas más específicas van primero.
// El primer match ganador es el que se usa por problema.
export const PROBLEM_MATCH_CATALOG: ProblemMatchRule[] = [

  // ══════════════════════════════════════════════════════════════
  // EXACT_MATCH + CRITICAL — pierde ventas o clientes HOY
  // ══════════════════════════════════════════════════════════════

  {
    pattern: /sin.?ecommerce|no.?vend.?online|sin.?tienda.?online|no.?tiene.?ecommerce|vende.+solo.+físic/i,
    serviceId: 'ecommerce',
    matchType: 'EXACT_MATCH',
    businessImpact: 'CRITICAL',
  },
  {
    pattern: /sin.?sitio|no.?tiene.?web|sin.?página.?web|sin.{0,10}presencia.?(web|digital|online)|no.?tiene.?página/i,
    serviceId: 'web-new',
    matchType: 'EXACT_MATCH',
    businessImpact: 'CRITICAL',
  },
  {
    pattern: /no.?convierte|sin.?conversión|sin.?cta|sin.?call.?to.?action|visitas.+no.+consultas/i,
    serviceId: 'landing-page',
    matchType: 'EXACT_MATCH',
    businessImpact: 'CRITICAL',
  },
  {
    pattern: /ecommerce.+caído|tienda.+error|carrito.+roto|pago.+falla/i,
    serviceId: 'ecommerce',
    matchType: 'EXACT_MATCH',
    businessImpact: 'CRITICAL',
  },

  // ══════════════════════════════════════════════════════════════
  // EXACT_MATCH + HIGH — pierde oportunidades significativas
  // ══════════════════════════════════════════════════════════════

  // GBP antes que seo-local: strings como "no aparece en Google Maps" dentro de un problema GBP
  // serían robadas por seo-local si no se evalúa primero el patrón más específico.
  {
    pattern: /sin.{0,15}google.?business|sin.{0,15}(ficha|perfil).{0,20}(google|maps)|gbp.{0,20}sin.{0,10}reclamar|sin.?gbp|no.{0,10}tiene.{0,10}gbp/i,
    serviceId: 'gbp-management',
    matchType: 'EXACT_MATCH',
    businessImpact: 'HIGH',
  },
  {
    pattern: /sin.?seo|no.?aparece.+google|sin.?posicionamiento|invisible.+google|no.+índice/i,
    serviceId: 'seo-local',
    matchType: 'EXACT_MATCH',
    businessImpact: 'HIGH',
  },
  {
    pattern: /sin.?instagram|redes.+abandonadas|sin.?redes.?sociales|sin.?presencia.+redes|no.+redes/i,
    serviceId: 'social-management',
    matchType: 'EXACT_MATCH',
    businessImpact: 'HIGH',
  },
  // SSL inválido/vencido — bloquea navegación y mata conversión → hostingguard, no seo-local
  {
    pattern: /ssl.{0,10}inv[aá]lid|err_tls|certificado.{0,10}(inv[aá]lid|error|vencid|expir)|tls.{0,10}inv[aá]lid|cert.{0,20}(alt.?name|vencid)/i,
    serviceId: 'hostingguard',
    matchType: 'EXACT_MATCH',
    businessImpact: 'HIGH',
  },
  {
    pattern: /vulnerab|sitio.+hackeado|malware|sin.?hsts|sin.?csp\b|headers.+seguridad.+ausentes/i,
    serviceId: 'hostingguard',
    matchType: 'EXACT_MATCH',
    businessImpact: 'HIGH',
  },
  {
    pattern: /sitio.+desactualiz|web.+antigua|web.+obsoleta|diseño.+anticuado|aspecto.+viejo/i,
    serviceId: 'web-redesign',
    matchType: 'EXACT_MATCH',
    businessImpact: 'HIGH',
  },

  // ══════════════════════════════════════════════════════════════
  // STRONG_MATCH + MEDIUM — afecta calidad, no urgente hoy
  // ══════════════════════════════════════════════════════════════

  {
    pattern: /velocidad|lento|carga.+lenta|performance|core.?web.?vitals|tiempo.+carga/i,
    serviceId: 'seo-technical',
    matchType: 'STRONG_MATCH',
    businessImpact: 'MEDIUM',
  },
  {
    pattern: /meta.?desc|title.?tag|h1\b|canonical|robots\.txt|sitemap\.xml/i,
    serviceId: 'seo-technical',
    matchType: 'STRONG_MATCH',
    businessImpact: 'MEDIUM',
  },
  {
    pattern: /schema|datos.?estructurados|json.?ld|structured.?data|rich.?results/i,
    serviceId: 'seo-schema',
    matchType: 'STRONG_MATCH',
    businessImpact: 'MEDIUM',
  },
  {
    pattern: /sin.?responsive|no.?adapta.+móvil|no.+mobile|sin.?versión.+móvil|móvil.+roto/i,
    serviceId: 'web-redesign',
    matchType: 'STRONG_MATCH',
    businessImpact: 'MEDIUM',
  },
  {
    pattern: /redes.+inactivas|instagram.+pocas.?publi|instagram.+sin.?actividad|contenido.+escaso/i,
    serviceId: 'social-management',
    matchType: 'STRONG_MATCH',
    businessImpact: 'MEDIUM',
  },
  {
    pattern: /seo.+local|búsqueda.?local|no.+aparece.+ciudad|ranking.+local/i,
    serviceId: 'seo-local',
    matchType: 'STRONG_MATCH',
    businessImpact: 'MEDIUM',
  },
  {
    pattern: /sin.?formulario.+contacto|sin.?captura|lead.+sin|sin.+leads/i,
    serviceId: 'lead-capture',
    matchType: 'STRONG_MATCH',
    businessImpact: 'MEDIUM',
  },
  {
    pattern: /gbp.+incompleto|gbp.+sin.+fotos|gbp.+sin.+horarios|google.?business.+desactualiz/i,
    serviceId: 'gbp-management',
    matchType: 'STRONG_MATCH',
    businessImpact: 'MEDIUM',
  },

  // ══════════════════════════════════════════════════════════════
  // PARTIAL_MATCH + LOW — detalles cosméticos o señales débiles
  // ══════════════════════════════════════════════════════════════

  {
    pattern: /favicon|logo.+baja.?calidad|tipograf|paleta.?color|fuente.+inconsist/i,
    serviceId: 'web-redesign',
    matchType: 'PARTIAL_MATCH',
    businessImpact: 'LOW',
  },
  {
    pattern: /open.?graph|og.?image|meta.?social|twitter.?card/i,
    serviceId: 'seo-technical',
    matchType: 'PARTIAL_MATCH',
    businessImpact: 'LOW',
  },
  {
    pattern: /ssl\b|certificado.?ssl|https\b|seguridad.+básica|http.+en.+lugar/i,
    serviceId: 'hostingguard',
    matchType: 'PARTIAL_MATCH',
    businessImpact: 'LOW',
  },
  {
    pattern: /alt.?tag|texto.?alternativo|imagen.+sin.?alt/i,
    serviceId: 'seo-technical',
    matchType: 'PARTIAL_MATCH',
    businessImpact: 'LOW',
  },

  // ══════════════════════════════════════════════════════════════
  // WEAK_MATCH — relación indirecta, baja confianza comercial
  // ══════════════════════════════════════════════════════════════

  {
    pattern: /hosting.+lento|servidor.+lento|uptime|caídas.+frecuentes/i,
    serviceId: 'hostingguard',
    matchType: 'WEAK_MATCH',
    businessImpact: 'MEDIUM',
  },
  {
    pattern: /dominio.+próximo.+vencer|renovación.+dominio/i,
    serviceId: 'hostingguard',
    matchType: 'WEAK_MATCH',
    businessImpact: 'LOW',
  },
];

export function findAllServiceMatches(
  problems: string[],
  inspyraServiceIds: Set<string>,
): ServiceMatchResult[] {
  const results: ServiceMatchResult[] = [];

  for (const problema of problems) {
    for (const rule of PROBLEM_MATCH_CATALOG) {
      if (rule.pattern.test(problema) && inspyraServiceIds.has(rule.serviceId)) {
        results.push({
          serviceId: rule.serviceId,
          problema,
          matchType: rule.matchType,
          businessImpact: rule.businessImpact,
        });
        break; // primer match ganador por problema
      }
    }
  }

  return results;
}

// Mejor match = mayor suma (matchFit + impact), desempate por matchType primero.
export function findBestServiceMatch(matches: ServiceMatchResult[]): ServiceMatchResult {
  return matches.reduce((best, m) => {
    const scoreM    = MATCH_TYPE_SCORE[m.matchType]    + IMPACT_SCORE[m.businessImpact];
    const scoreBest = MATCH_TYPE_SCORE[best.matchType] + IMPACT_SCORE[best.businessImpact];
    return scoreM > scoreBest ? m : best;
  });
}

export function calcContactability(ctx: {
  hasWebsite: boolean;
  hasInstagram: boolean;
  hasLinkedIn: boolean;
  hasContactPoint?: boolean;
}): number {
  return (
    (ctx.hasWebsite   ? 6 : 0) +
    (ctx.hasInstagram ? 6 : 0) +
    (ctx.hasLinkedIn  ? 4 : 0) +
    (ctx.hasContactPoint !== false ? 4 : 0)  // email/tel — true por defecto si no se sabe
  );
}
