/**
 * ERP-052 — Benchmark sector gastronómico
 * 10 prospectos con problemas típicos del sector restaurantes/gastronomía.
 * Valida que el motor comercial funciona fuera del sector legal y bodegas.
 * No escribe nada en DB.
 */
import {
  INSPYRA_SERVICE_IDS,
  findAllServiceMatches,
  findBestServiceMatch,
  calcContactability,
  MATCH_TYPE_SCORE,
  IMPACT_SCORE,
  SIR_CATALOG,
  buildProspectContext,
} from '../src/modules/service-intelligence/catalog';

const IMPACT_TO_PRIORIDAD: Record<string, string> = {
  CRITICAL: 'ALTA', HIGH: 'ALTA', MEDIUM: 'MEDIA', LOW: 'BAJA',
};

function calcScore(best: ReturnType<typeof findBestServiceMatch>, ctx: { hasWebsite: boolean; hasInstagram: boolean; hasLinkedIn: boolean }): number {
  return Math.min(
    MATCH_TYPE_SCORE[best.matchType] + IMPACT_SCORE[best.businessImpact] + calcContactability({ ...ctx, hasContactPoint: true }),
    100,
  );
}

// 10 restaurantes reales del sector gastronómico
// Problemas representativos de lo que generaría el agente de enriquecimiento
const PROSPECTS = [
  {
    nombreEmpresa: 'El Almacén de Ramiro',
    rubro: 'Restaurante Parrilla - Alta Cocina',
    ciudad: 'Palermo, Buenos Aires',
    website: 'https://almacenramiro.com.ar',
    instagram: '@almacenramiro',
    linkedin: null,
    problemasEncontrados: [
      'Sin ecommerce ni sistema de pedidos online',
      'Sin Google Business reclamado — no aparece en Maps local',
      'Web informativa sin conversión ni reservas online',
      'Presencia en Instagram fuerte (42.000 seguidores) pero sin monetización digital',
    ],
  },
  {
    nombreEmpresa: 'Pizzería Güerrin',
    rubro: 'Pizzería - Delivery y Salon',
    ciudad: 'Centro, Buenos Aires',
    website: null,
    instagram: '@pizzeriaguerrin',
    linkedin: null,
    problemasEncontrados: [
      'Sin sitio web propio — dependen de plataformas de delivery (comisiones 30%)',
      'Sin presencia en Google Business',
      'Sin canal de venta directa digital sin intermediarios',
      'Sin posicionamiento SEO local',
    ],
  },
  {
    nombreEmpresa: 'Café Tortoni',
    rubro: 'Café Histórico - Turismo gastronómico',
    ciudad: 'Monserrat, Buenos Aires',
    website: 'https://cafetortoni.com.ar',
    instagram: '@cafetortonioficial',
    linkedin: null,
    problemasEncontrados: [
      'Sitio web desactualizado (diseño 2016, HTML estático)',
      'Sin sistema de reservas online — todo por teléfono',
      'Sin SEO para turismo ("mejor café Buenos Aires", "café histórico BA")',
      'Sin tienda online para venta de productos y merchandising',
    ],
  },
  {
    nombreEmpresa: 'La Mar Cebichería',
    rubro: 'Restaurante Peruano - Fine Dining',
    ciudad: 'Palermo, Buenos Aires',
    website: 'https://lamarcebicheria.com',
    instagram: '@lamarbsas',
    linkedin: null,
    problemasEncontrados: [
      'Web no convierte — sin CTA de reservas visible',
      'Sin posicionamiento en Google para "ceviche Buenos Aires"',
      'Velocidad de carga muy baja — 6.4 segundos en mobile',
      'Sin integración de reseñas de Google en el sitio',
    ],
  },
  {
    nombreEmpresa: 'Don Julio Parrilla',
    rubro: 'Parrilla Premium - Carnes',
    ciudad: 'Palermo, Buenos Aires',
    website: 'https://parrilladonjulio.com',
    instagram: '@parrilladonjulio',
    linkedin: null,
    problemasEncontrados: [
      'Sin tienda online para venta de cortes y productos',
      'Sin SEO técnico — meta descriptions vacías en todas las páginas',
      'Web desactualizada visualmente (últimos cambios en 2020)',
      'Sin presencia activa en LinkedIn para B2B (eventos corporativos)',
    ],
  },
  {
    nombreEmpresa: 'Heladería Persicco',
    rubro: 'Heladería Artesanal - Cadena',
    ciudad: 'Multiple sucursales, Buenos Aires',
    website: 'https://persicco.com',
    instagram: '@heladeriapersicco',
    linkedin: null,
    problemasEncontrados: [
      'Sin ecommerce para pedidos online de catering y eventos',
      'Sin posicionamiento SEO local por sucursal ("helado artesanal [barrio]")',
      'Redes sociales sin gestión profesional — contenido irregular',
    ],
  },
  {
    nombreEmpresa: 'Bar El Federal',
    rubro: 'Bar Tradicional - San Telmo',
    ciudad: 'San Telmo, Buenos Aires',
    website: null,
    instagram: null,
    linkedin: null,
    problemasEncontrados: [
      'Sin ninguna presencia digital',
      'Sin sitio web',
      'No aparece en Google Maps — ficha sin reclamar',
      'Invisible para turistas que buscan bares históricos de Buenos Aires',
    ],
  },
  {
    nombreEmpresa: 'Tegui Restaurante',
    rubro: 'Restaurante Gourmet - Cocina Creativa',
    ciudad: 'Palermo, Buenos Aires',
    website: 'https://tegui.info',
    instagram: '@teguirestaurante',
    linkedin: null,
    problemasEncontrados: [
      'Sin sistema de reservas online propio — usa plataforma tercera (dependencia total)',
      'Sin ecommerce para menú degustación + maridaje como producto premium',
      'Sin posicionamiento SEO para "mejores restaurantes Buenos Aires"',
    ],
  },
  {
    nombreEmpresa: 'Sushi Club',
    rubro: 'Restaurante Japonés - Cadena',
    ciudad: 'Multiple sucursales, Buenos Aires',
    website: 'https://sushiclub.com.ar',
    instagram: '@sushiclubarg',
    linkedin: null,
    problemasEncontrados: [
      'Sitio web en Wix muy básico sin ecommerce propio',
      'Depende 100% de Rappi/PedidosYa — sin canal de venta directa',
      'Sin SEO local por sucursal — baja visibilidad en búsquedas de barrio',
      'Redes sociales con baja frecuencia de publicación',
    ],
  },
  {
    nombreEmpresa: 'Chori',
    rubro: 'Street Food - Choripán Gourmet',
    ciudad: 'Palermo, Buenos Aires',
    website: 'https://chori.com.ar',
    instagram: '@chori_ok',
    linkedin: null,
    problemasEncontrados: [
      'Sin ecommerce ni sistema de delivery propio',
      'Sin posicionamiento SEO ("choripán gourmet Buenos Aires")',
      'Redes sociales abandonadas hace más de 6 meses',
    ],
  },
];

function run() {
  console.log('\n' + '═'.repeat(110));
  console.log('ERP-052 — Benchmark Gastronómico · 10 restaurantes · Dataset limpio');
  console.log('═'.repeat(110));

  type Row = {
    empresa: string;
    rubro: string;
    problemas: string[];
    match: string;
    matchType: string;
    businessImpact: string;
    contactScore: number;
    score: number;
    resultado: string;
    allMatchCount: number;
    discardReason?: string;
  };

  const rows: Row[] = [];

  for (const p of PROSPECTS) {
    const ctx = buildProspectContext(p as never);
    const contactScore = calcContactability({ ...ctx, hasContactPoint: true });

    if (p.problemasEncontrados.length === 0) {
      rows.push({ empresa: p.nombreEmpresa, rubro: p.rubro, problemas: [], match: '—', matchType: '—', businessImpact: '—', contactScore, score: 0, resultado: 'DISCARDED', allMatchCount: 0, discardReason: 'INSUFFICIENT_DATA' });
      continue;
    }

    const allMatches = findAllServiceMatches(p.problemasEncontrados, INSPYRA_SERVICE_IDS);

    if (allMatches.length === 0) {
      rows.push({ empresa: p.nombreEmpresa, rubro: p.rubro, problemas: p.problemasEncontrados, match: '—', matchType: '—', businessImpact: '—', contactScore, score: 0, resultado: 'DISCARDED', allMatchCount: 0, discardReason: 'NO_SERVICE_MATCH' });
      continue;
    }

    const best = findBestServiceMatch(allMatches);
    const score = calcScore(best, ctx);
    const svcName = SIR_CATALOG.find(s => s.id === best.serviceId)?.name ?? best.serviceId;

    rows.push({
      empresa: p.nombreEmpresa,
      rubro: p.rubro,
      problemas: p.problemasEncontrados,
      match: svcName,
      matchType: best.matchType,
      businessImpact: best.businessImpact,
      contactScore,
      score,
      resultado: 'PENDING',
      allMatchCount: allMatches.length,
    });
  }

  rows.sort((a, b) => b.score - a.score);

  rows.forEach((r, i) => {
    const matchPts = MATCH_TYPE_SCORE[r.matchType as keyof typeof MATCH_TYPE_SCORE] ?? 0;
    const impactPts = IMPACT_SCORE[r.businessImpact as keyof typeof IMPACT_SCORE] ?? 0;
    console.log(`\n[${i + 1}] ${r.empresa} · ${r.rubro}`);
    console.log(`    Problemas (${r.problemas.length}): ${r.problemas.slice(0, 2).join(' | ') || '—'}`);
    if (r.resultado === 'DISCARDED') {
      console.log(`    DISCARDED: ${r.discardReason}`);
    } else {
      console.log(`    Mejor match: ${r.match}`);
      console.log(`    Match Type:  ${r.matchType}  (${matchPts} pts)`);
      console.log(`    Biz Impact:  ${r.businessImpact}  (${impactPts} pts)`);
      console.log(`    Contactab:   ${r.contactScore} pts`);
      console.log(`    SCORE FINAL: ${r.score}/100  ←  ${r.allMatchCount} match(es) en total`);
      console.log(`    Resultado:   ${r.resultado}`);
    }
  });

  console.log('\n' + '═'.repeat(110));
  const pending = rows.filter(r => r.resultado === 'PENDING');
  const discarded = rows.filter(r => r.resultado === 'DISCARDED');
  console.log(`RESUMEN: ${pending.length} PENDING · ${discarded.length} DISCARDED`);
  if (pending.length > 0) {
    const avg = Math.round(pending.reduce((s, r) => s + r.score, 0) / pending.length);
    console.log(`Score promedio (PENDING): ${avg}`);
    console.log(`Score máximo: ${rows[0].score} — ${rows[0].empresa}`);
    console.log(`Score mínimo (PENDING): ${pending[pending.length - 1].score} — ${pending[pending.length - 1].empresa}`);
  }

  // Problemas sin match
  const unmatched: string[] = [];
  for (const p of PROSPECTS) {
    for (const prob of p.problemasEncontrados) {
      if (findAllServiceMatches([prob], INSPYRA_SERVICE_IDS).length === 0) unmatched.push(prob);
    }
  }
  if (unmatched.length > 0) {
    console.log(`\n── Problemas sin match (${unmatched.length}) ──`);
    unmatched.forEach(p => console.log(`  · "${p}"`));
  }
  console.log('');
}

run();
