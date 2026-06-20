/**
 * Demo: Pipeline completo — Discovery → Opportunity → Proposal → Outreach
 *
 * Prospecto real: Veterinaria XYZ, Buenos Aires
 *
 * Cómo correrlo:
 *   cd apps/api
 *   npx ts-node src/modules/service-intelligence/catalog/pipeline-demo.ts
 */

import { buildProspectContext, scoreFromContext, SIR_CATALOG } from './index';
import type { ServiceOpportunity } from './types';

const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  cyan:    '\x1b[36m',
  red:     '\x1b[31m',
  magenta: '\x1b[35m',
  gray:    '\x1b[90m',
  blue:    '\x1b[34m',
};

function sep(char = '─', len = 72) {
  return C.gray + char.repeat(len) + C.reset;
}

function scoreBar(score: number): string {
  const filled = Math.round(score / 10);
  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
  const color = score >= 80 ? C.green : score >= 55 ? C.yellow : C.red;
  return `${color}${bar}${C.reset} ${score}/100`;
}

// ── Prospecto de prueba ────────────────────────────────────────────────────────

const PROSPECT = {
  id: 'demo-001',
  nombreEmpresa: 'Veterinaria XYZ',
  rubro: 'Veterinaria / Clínica Veterinaria',
  website: 'https://veterinariaxyz.com.ar',
  instagram: null as string | null,
  linkedin: null as string | null,
  empleadosEstimado: 4,
  pais: 'Argentina',
  ciudad: 'Buenos Aires',
  problemasEncontrados: [
    'Sin sistema de turnos online — atienden solo por teléfono',
    'Sin reseñas en Google — competencia tiene 4.7 estrellas',
    'Sin Google Business Profile optimizado',
    'Certificado SSL desactualizado — sitio sirve HTTP sin redirect',
    'Sin formulario de contacto — solo email genérico en el footer',
    'Meta description ausente en todas las páginas',
  ],
};

// ── Simulate Website Audit serviceFits ────────────────────────────────────────

function simulateWebsiteAudit(ctx: ReturnType<typeof buildProspectContext>, opps: ServiceOpportunity[]) {
  const auditScore = 38; // sitio con varios problemas técnicos
  const commercialOpportunityScore = 84; // negocio real, activo, con necesidades claras

  // Map top SIR opportunities to serviceFits format
  const serviceFits: Record<string, number> = {};
  for (const opp of opps) {
    serviceFits[opp.serviceId] = opp.opportunityScore;
  }

  const erroresVisibles = PROSPECT.problemasEncontrados;

  return { auditScore, commercialOpportunityScore, serviceFits, erroresVisibles };
}

// ── Opportunity Agent simulation ───────────────────────────────────────────────

function simulateOpportunityAgent(
  opps: ServiceOpportunity[],
  ctx: ReturnType<typeof buildProspectContext>,
) {
  const topSir = opps.slice(0, 5);
  const problemScore = PROSPECT.problemasEncontrados.length >= 5 ? 25 : 20;
  const priorityScore = 20;
  const fitScore = 25;
  const sirBonus = Math.round(Math.min((topSir[0]?.opportunityScore ?? 0) / 10, 15));
  const ticketScore = 15;
  const agentScore = Math.min(problemScore + priorityScore + fitScore + ticketScore + sirBonus, 100);

  const finalServices = topSir.slice(0, 3).map((o) => o.serviceName);
  const estimatedTicketUsd = topSir.slice(0, 3).reduce((s, o) => s + o.estimatedTicketUsd[0], 0);

  const reasoning = `Sector: ${ctx.sector}. Top oportunidades: ${topSir
    .slice(0, 3)
    .map((o) => `${o.serviceName} (${o.opportunityScore}/100 — "${o.pitchLine}")`)
    .join('; ')}.`;

  return {
    agentScore,
    servicesRecommended: finalServices,
    estimatedTicketUsd,
    reasoning,
    decisionFactors: {
      problemScore,
      priorityScore,
      fitScore,
      ticketScore,
      sirBonus,
      sector: ctx.sector,
      businessModel: ctx.businessModel,
      sirOpportunities: topSir,
    },
  };
}

// ── Proposal Agent — prompt que se enviaría a Claude ─────────────────────────

function buildSirBlock(opps: ServiceOpportunity[], ctx: ReturnType<typeof buildProspectContext>): string {
  const top = opps.slice(0, 4);
  if (top.length === 0) return '';
  return `
COMMERCIAL INTELLIGENCE (Service Intelligence Registry):
Sector: ${ctx.sector} | Business Model: ${ctx.businessModel}
Top opportunities detected:
${top.map((o, i) => `  ${i + 1}. [${o.opportunityScore}/100] ${o.serviceName}
     Signal: ${o.signals[0]}
     Pitch: "${o.pitchLine}"
     Ticket: USD ${o.estimatedTicketUsd[0]}–${o.estimatedTicketUsd[1]}`).join('\n')}
`;
}

function buildOutreachPrompt(
  opportunity: ReturnType<typeof simulateOpportunityAgent>,
  opps: ServiceOpportunity[],
  ctx: ReturnType<typeof buildProspectContext>,
): string {
  const sirBlock = buildSirBlock(opps, ctx);
  const topTicket = opps[0]?.estimatedTicketUsd ?? [300, 800];

  return `You are Inspyra's Proposal Agent. Draft a commercial outreach email in Spanish for a new prospect.

PROSPECT:
Company: ${PROSPECT.nombreEmpresa}
Industry: ${PROSPECT.rubro}
City: ${PROSPECT.ciudad}, ${PROSPECT.pais}
Website: ${PROSPECT.website}
Problems found: ${PROSPECT.problemasEncontrados.join('; ')}

DETECTED OPPORTUNITY:
Score: ${opportunity.agentScore}/100
Services recommended: ${opportunity.servicesRecommended.join(', ')}
Estimated ticket: USD ${opportunity.estimatedTicketUsd}
Agent reasoning: ${opportunity.reasoning}
${sirBlock}
Write a 3-paragraph outreach email in Spanish (Argentina style — tuteo informal) that:
1. Opens with the specific pain point most relevant to this business (NOT a generic greeting)
2. Connects 2-3 specific problems found to concrete services Inspyra can solve
3. Closes with a clear, low-friction CTA (15-minute call, no "schedule a demo" corporate language)

Use the pitch lines from the SIR block. Be specific about this business — no templates.
Ticket estimate: USD ${topTicket[0]}–${topTicket[1]}/month.
Format: Just the email body (no subject line, no JSON).`;
}

// ── Main ───────────────────────────────────────────────────────────────────────

function run() {
  console.log('\n' + sep('═'));
  console.log(C.bold + C.cyan + '  PIPELINE DEMO — Motor de Descubrimiento Comercial' + C.reset);
  console.log(C.gray + '  Inspyra ERP · Veterinaria XYZ · Buenos Aires' + C.reset);
  console.log(sep('═') + '\n');

  // ── PASO 1: SIR Scoring ────────────────────────────────────────────────────
  console.log(C.bold + C.blue + '  PASO 1 — Website Audit → SIR Scoring' + C.reset);
  console.log(sep() + '\n');

  const ctx = buildProspectContext(PROSPECT);
  const opps = scoreFromContext(ctx, SIR_CATALOG);
  const audit = simulateWebsiteAudit(ctx, opps);

  console.log(`  Prospecto:        ${C.bold}${PROSPECT.nombreEmpresa}${C.reset} — ${PROSPECT.ciudad}`);
  console.log(`  Rubro:            ${PROSPECT.rubro}`);
  console.log(`  Sector detectado: ${C.bold}${C.green}${ctx.sector}${C.reset}`);
  console.log(`  Business Model:   ${C.bold}${ctx.businessModel}${C.reset}`);
  console.log(`  Website:          ${ctx.hasWebsite ? C.green + '✓' : C.red + '✗'}${C.reset}`);
  console.log(`  Instagram:        ${ctx.hasInstagram ? C.green + '✓' : C.red + '✗'}${C.reset}`);
  console.log();
  console.log(`  ${C.yellow}auditScore:${C.reset}              ${audit.auditScore}/100  (estado técnico del sitio)`);
  console.log(`  ${C.green}commercialOpportunityScore:${C.reset}  ${audit.commercialOpportunityScore}/100  (potencial de venta)`);
  console.log();
  console.log(`  ${C.bold}serviceFits (top 6):${C.reset}`);
  const topFits = Object.entries(audit.serviceFits).sort(([, a], [, b]) => b - a).slice(0, 6);
  for (const [id, score] of topFits) {
    console.log(`    ${id.padEnd(20)} ${scoreBar(score)}`);
  }
  console.log();

  // ── PASO 2: Opportunity Agent ──────────────────────────────────────────────
  console.log(sep());
  console.log(C.bold + C.blue + '\n  PASO 2 — Opportunity Agent' + C.reset);
  console.log(sep() + '\n');

  const opp = simulateOpportunityAgent(opps, ctx);

  console.log(`  Score:        ${C.bold}${C.green}${opp.agentScore}/100${C.reset}`);
  console.log(`  SIR Bonus:    +${opp.decisionFactors.sirBonus} pts (top oportunidad: ${opps[0]?.opportunityScore}/100)`);
  console.log(`  Servicios:    ${C.green}${opp.servicesRecommended.join(', ')}${C.reset}`);
  console.log(`  Ticket est.:  ${C.bold}${C.green}USD ${opp.estimatedTicketUsd}${C.reset} (suma top-3 servicios)`);
  console.log();
  console.log(`  ${C.cyan}Reasoning:${C.reset}`);
  const reasoningLines = opp.reasoning.match(/.{1,80}/g) ?? [];
  for (const line of reasoningLines) {
    console.log(`    ${C.dim}${line}${C.reset}`);
  }
  console.log();
  console.log(`  ${C.bold}Top 5 oportunidades SIR:${C.reset}`);
  for (const [i, o] of opps.slice(0, 5).entries()) {
    const pfx = i === 0 ? C.bold + C.green : i <= 2 ? C.yellow : C.gray;
    console.log(`    ${i + 1}. ${pfx}${o.serviceName}${C.reset} ${scoreBar(o.opportunityScore)}`);
    console.log(`       ${C.dim}"${o.pitchLine}"${C.reset}`);
    console.log(`       Ticket: USD ${o.estimatedTicketUsd[0]}–${o.estimatedTicketUsd[1]}`);
  }
  console.log();

  // ── PASO 3: Prompt que se enviaría al Proposal Agent ─────────────────────
  console.log(sep());
  console.log(C.bold + C.blue + '\n  PASO 3 — Prompt inyectado al Proposal Agent' + C.reset);
  console.log(sep() + '\n');

  const outreachPrompt = buildOutreachPrompt(opp, opps, ctx);
  const promptLines = outreachPrompt.split('\n');
  for (const line of promptLines) {
    console.log(`  ${C.dim}${line}${C.reset}`);
  }

  console.log('\n' + sep('═'));
  console.log(C.bold + C.cyan + '  RESUMEN DEL PIPELINE' + C.reset);
  console.log(sep('═') + '\n');
  console.log(`  Prospecto:    ${PROSPECT.nombreEmpresa} — ${PROSPECT.ciudad}`);
  console.log(`  Sector:       ${ctx.sector} (${ctx.businessModel})`);
  console.log(`  Score total:  ${opp.agentScore}/100`);
  console.log(`  Servicios:    ${opp.servicesRecommended.slice(0, 2).join(' + ')}`);
  console.log(`  Ticket est.:  USD ${opp.estimatedTicketUsd}/mes`);
  console.log(`  Estado:       ${C.green}LISTO_OUTREACH → email generado${C.reset}`);
  console.log('\n' + sep('═') + '\n');
}

run();
