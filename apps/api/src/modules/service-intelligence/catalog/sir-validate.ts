/**
 * SIR Validation Script — Fase 1 + Fase 2
 *
 * Compara output ANTES (sin SIR) vs DESPUÉS (con SIR) para 6 prospectos reales.
 * No requiere servidor ni DB.
 *
 * Cómo correrlo:
 *   cd apps/api
 *   npx ts-node src/modules/service-intelligence/catalog/sir-validate.ts
 */

import { buildProspectContext, scoreFromContext, SIR_CATALOG } from './index';

// ── Colores para consola ──────────────────────────────────────────────────────

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  red:    '\x1b[31m',
  magenta: '\x1b[35m',
  gray:   '\x1b[90m',
};

// ── Casos de prueba ───────────────────────────────────────────────────────────

const TEST_CASES = [
  {
    label: 'Clínica Dental — Buenos Aires',
    prospect: {
      rubro: 'Odontología / Clínica Dental',
      instagram: null,
      linkedin: null,
      website: 'https://clinicadental.com.ar',
      empleadosEstimado: 8,
      pais: 'Argentina',
      ciudad: 'Buenos Aires',
      problemasEncontrados: [
        'Sin Schema.org / datos estructurados',
        'Meta description ausente en páginas internas',
        'Sin sistema de turnos online — solo WhatsApp',
        'Sin Google Business Profile optimizado',
        'Certificado SSL desactualizado',
      ],
    },
  },
  {
    label: 'Restaurante — Mendoza',
    prospect: {
      rubro: 'Gastronomía / Restaurante',
      instagram: '@elrestaurante',
      linkedin: null,
      website: 'https://elrestaurante.com.ar',
      empleadosEstimado: 15,
      pais: 'Argentina',
      ciudad: 'Mendoza',
      problemasEncontrados: [
        'Sin reseñas gestionadas en Google',
        'Google Business Profile sin actualizar (horarios incorrectos)',
        'Sitio web desactualizado, sin responsive en mobile',
        'Sin pixel de Meta / Facebook instalado',
      ],
    },
  },
  {
    label: 'Estudio Legal — CABA',
    prospect: {
      rubro: 'Estudio Jurídico / Abogados',
      instagram: null,
      linkedin: 'linkedin.com/company/estudio-legal',
      website: 'https://estudiolegal.com.ar',
      empleadosEstimado: 12,
      pais: 'Argentina',
      ciudad: 'CABA',
      problemasEncontrados: [
        'Sitio sin SEO local — no aparece en búsquedas "abogado laboral CABA"',
        'Sin landing de conversión — el formulario de contacto está en la 4ta página',
        'Sin CRM — los leads entran por email y se pierden',
        'Sin HSTS, CSP ausente en headers HTTP',
      ],
    },
  },
  {
    label: 'Inmobiliaria — Córdoba',
    prospect: {
      rubro: 'Inmobiliaria / Bienes Raíces',
      instagram: '@inmobiliaria_cba',
      linkedin: null,
      website: null,
      empleadosEstimado: 5,
      pais: 'Argentina',
      ciudad: 'Córdoba',
      problemasEncontrados: [
        'Sin sitio web propio — solo operan por Instagram',
        'Sin CRM — gestionan propiedades en planilla de cálculo',
        'Sin WhatsApp Business configurado',
      ],
    },
  },
  {
    label: 'Gimnasio / Fitness — Santiago de Chile',
    prospect: {
      rubro: 'Fitness / Gimnasio',
      instagram: null,
      linkedin: null,
      website: 'https://gimnasio.cl',
      empleadosEstimado: 6,
      pais: 'Chile',
      ciudad: 'Santiago',
      problemasEncontrados: [
        'Sin sistema de turnos / clases online',
        'Sin reseñas en Google (competencia tiene 4.8 estrellas)',
        'Sin redes sociales activas hace 6 meses',
        'Sitio lento: 8 scripts síncronos en HEAD',
      ],
    },
  },
  {
    label: 'Empresa de Software — México',
    prospect: {
      rubro: 'Tecnología / Software / SaaS',
      instagram: null,
      linkedin: 'linkedin.com/company/softwaremx',
      website: 'https://softwaremx.com',
      empleadosEstimado: 25,
      pais: 'México',
      ciudad: 'CDMX',
      problemasEncontrados: [
        'Sin landing de conversión específica por producto',
        'Sin CRM integrado al proceso de ventas',
        'Blog abandonado hace 1 año — oportunidad de SEO content',
        'Sin email automation / nurturing de leads',
      ],
    },
  },
];

// ── Output ANTES (sistema viejo, sin SIR, sin DB rules configuradas) ──────────

function simulateAntesOutput(problems: string[]) {
  return {
    reasoning: `Evaluador: ${problems.length} problemas detectados, score 10/100.`,
    servicesRecommended: [],
    estimatedTicketUsd: 0,
    decisionFactors: {
      problemScore: problems.length >= 5 ? 25 : problems.length >= 3 ? 15 : 10,
      priorityScore: 0,
      fitScore: 0,
      ticketScore: 0,
    },
  };
}

// ── Helpers de display ────────────────────────────────────────────────────────

function scoreBar(score: number): string {
  const filled = Math.round(score / 10);
  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
  const color = score >= 80 ? C.green : score >= 55 ? C.yellow : C.red;
  return `${color}${bar}${C.reset} ${score}/100`;
}

function separator(char = '─', len = 70) {
  return C.gray + char.repeat(len) + C.reset;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  console.log('\n' + separator('═'));
  console.log(C.bold + C.cyan + '  SIR VALIDATION — Fase 1: Opportunity Agent' + C.reset);
  console.log(C.gray + '  Comparativa ANTES (sin SIR) vs DESPUÉS (con SIR)' + C.reset);
  console.log(separator('═') + '\n');

  for (const tc of TEST_CASES) {
    const ctx = buildProspectContext(tc.prospect);
    const opportunities = scoreFromContext(ctx, SIR_CATALOG);
    const antes = simulateAntesOutput(tc.prospect.problemasEncontrados);
    const topSir = opportunities.slice(0, 4);

    const afterServices = topSir.map(o => o.serviceName);
    const afterTicket = topSir.slice(0, 3).reduce((s, o) => s + o.estimatedTicketUsd[0], 0);
    const afterReasoning = topSir.length > 0
      ? `Sector: ${ctx.sector}. Top: ${topSir.slice(0, 2).map(o => `${o.serviceName} (${o.opportunityScore}/100 — "${o.pitchLine}")`).join('; ')}.`
      : 'Sin oportunidades detectadas.';

    console.log(separator());
    console.log(C.bold + `  📌 ${tc.label}` + C.reset);
    console.log(C.gray + `     Rubro: ${tc.prospect.rubro}  |  Web: ${tc.prospect.website ? '✓' : '✗'}  |  Instagram: ${tc.prospect.instagram ? '✓' : '✗'}  |  Empleados: ${tc.prospect.empleadosEstimado ?? '?'}` + C.reset);
    console.log();

    // Context detected
    console.log(`  ${C.cyan}Contexto detectado:${C.reset}`);
    console.log(`    Sector:        ${C.bold}${ctx.sector}${C.reset}`);
    console.log(`    Business Model:${C.bold} ${ctx.businessModel}${C.reset}`);
    console.log(`    Tiene website: ${ctx.hasWebsite ? C.green + '✓' : C.red + '✗'}${C.reset}`);
    console.log(`    Tiene Instagram:${ctx.hasInstagram ? C.green + ' ✓' : C.red + ' ✗'}${C.reset}`);
    console.log();

    // ANTES
    console.log(`  ${C.red}ANTES (sin SIR):${C.reset}`);
    console.log(`    Reasoning:   ${C.dim}${antes.reasoning}${C.reset}`);
    console.log(`    Servicios:   ${C.dim}(vacío — sin reglas DB configuradas)${C.reset}`);
    console.log(`    Ticket est.: ${C.dim}USD 0${C.reset}`);
    console.log();

    // DESPUÉS
    console.log(`  ${C.green}DESPUÉS (con SIR):${C.reset}`);
    if (topSir.length === 0) {
      console.log(`    ${C.yellow}Sin oportunidades detectadas para este contexto${C.reset}`);
    } else {
      topSir.forEach((o, i) => {
        const prefix = i === 0 ? C.bold + C.green : (i === 1 ? C.yellow : C.gray);
        console.log(`    ${i + 1}. ${prefix}${o.serviceName}${C.reset} ${scoreBar(o.opportunityScore)}`);
        console.log(`       Hook: ${C.dim}"${o.pitchLine}"${C.reset}`);
        console.log(`       Señal: ${C.dim}${o.signals[0]}${C.reset}`);
        console.log(`       Ticket: USD ${o.estimatedTicketUsd[0]}–${o.estimatedTicketUsd[1]}`);
      });
      console.log();
      console.log(`    Reasoning: ${C.green}${afterReasoning.slice(0, 120)}...${C.reset}`);
      console.log(`    Servicios: ${C.green}${afterServices.slice(0, 3).join(', ')}${C.reset}`);
      console.log(`    Ticket est.: ${C.green}USD ${afterTicket} (suma top-3)${C.reset}`);
    }
    console.log();
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(separator('═'));
  console.log(C.bold + C.cyan + '  RESUMEN — Impacto del SIR' + C.reset);
  console.log(separator('═'));
  console.log();

  let totalOpp = 0;
  let totalTicket = 0;
  const sectorCoverage: Record<string, number> = {};

  for (const tc of TEST_CASES) {
    const ctx = buildProspectContext(tc.prospect);
    const opps = scoreFromContext(ctx, SIR_CATALOG);
    totalOpp += opps.length;
    totalTicket += opps.slice(0, 3).reduce((s, o) => s + o.estimatedTicketUsd[0], 0);
    sectorCoverage[ctx.sector] = (sectorCoverage[ctx.sector] ?? 0) + 1;
  }

  console.log(`  Casos testados:      ${TEST_CASES.length}`);
  console.log(`  Oportunidades totales detectadas: ${C.green}${totalOpp}${C.reset} (${C.dim}antes: 0${C.reset})`);
  console.log(`  Ticket acumulado est.: ${C.green}USD ${totalTicket}${C.reset} (${C.dim}antes: USD 0${C.reset})`);
  console.log(`  Sectores cubiertos:  ${Object.keys(sectorCoverage).join(', ')}`);
  console.log();
  console.log(C.gray + '  Si los hooks comerciales son específicos y el sector es correcto,');
  console.log('  la Fase 1 funciona. Si hay errores de sector o servicios irrelevantes,');
  console.log('  corregir en catalog/catalog.ts o catalog/sectors.ts antes de Fase 3.' + C.reset);
  console.log();
  console.log(separator('═') + '\n');
}

run();
