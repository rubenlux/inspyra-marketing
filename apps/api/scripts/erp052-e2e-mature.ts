/**
 * ERP-052 — E2E sobre rubros maduros: bodegas premium + hoteles boutique
 * Objetivo: validar que NO_SERVICE_MATCH funciona — empresas con presencia digital
 * completa deben resultar DISCARDED, no PENDING.
 *
 * No escribe nada en DB. Mostrar mezcla real PENDING / DISCARDED.
 *
 * Uso: npx ts-node -r tsconfig-paths/register scripts/erp052-e2e-mature.ts
 */
import { spawn } from 'child_process';
import * as path from 'path';
import {
  INSPYRA_SERVICE_IDS,
  findAllServiceMatches,
  findBestServiceMatch,
  calcContactability,
  MATCH_TYPE_SCORE,
  IMPACT_SCORE,
  SIR_CATALOG,
} from '../src/modules/service-intelligence/catalog';

const PROJECT_ROOT = path.resolve(__dirname, '../../../../..');

// Siempre DRY_RUN en este script — validación de trazabilidad y descarte
const DRY_RUN = true;

function spawnClaude(prompt: string, idleMs = 90_000, totalMs = 300_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('claude', [
      '-p', '-',
      '--output-format', 'stream-json',
      '--verbose',
      '--dangerously-skip-permissions',
      '--strict-mcp-config',
      '--model', 'claude-haiku-4-5-20251001',
      '--allowedTools', 'WebFetch,WebSearch',
    ], {
      cwd: PROJECT_ROOT,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    child.stdin.write(prompt, 'utf8');
    child.stdin.end();

    let lineBuffer = '';
    let settled = false;
    let stderr = '';

    const done = (err?: Error, result?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(total);
      clearTimeout(idle);
      err ? reject(err) : resolve(result!);
    };

    const total = setTimeout(() => { child.kill('SIGTERM'); done(new Error('total timeout')); }, totalMs);
    let idle = setTimeout(() => { child.kill('SIGTERM'); done(new Error('idle timeout')); }, idleMs);

    child.stdout.on('data', (chunk: Buffer) => {
      clearTimeout(idle);
      idle = setTimeout(() => { child.kill('SIGTERM'); done(new Error('idle timeout')); }, idleMs);
      lineBuffer += chunk.toString();
      const lines = lineBuffer.split('\n');
      lineBuffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const ev = JSON.parse(line);
          if (ev.type === 'result') {
            ev.subtype === 'success' ? done(undefined, ev.result ?? '') : done(new Error(JSON.stringify(ev).slice(0, 200)));
          }
        } catch { /* partial */ }
      }
    });

    child.stderr.on('data', (c: Buffer) => { stderr += c.toString(); });
    child.on('close', code => { if (code !== 0 && !settled) done(new Error(`exit ${code}: ${stderr.slice(-300)}`)); });
  });
}

interface DiscoveredCompany {
  nombreEmpresa: string;
  website: string | null;
  instagram: string | null;
  telefono: string | null;
  ciudad: string;
  rubro: string;
  descripcion: string | null;
}

async function discoverCompanies(query: string, sector: string): Promise<DiscoveredCompany[]> {
  console.log(`\n[Discovery] Buscando: "${query}"…`);

  const prompt = `Sos un agente de extracción de datos para Inspyra Digital, agencia argentina.

TU TAREA: Encontrá empresas reales de "${sector}" en Argentina (preferentemente Mendoza o Buenos Aires).

INSTRUCCIONES:
1. Usá WebSearch con términos como "${query}", "mejores ${query}", "${query} premium"
2. Extraé entre 8 y 12 empresas REALES — priorizá empresas conocidas, consolidadas y con presencia digital profesional
3. Buscá: nombre real, website, instagram, teléfono, ciudad, rubro específico
4. IMPORTANTE: Priorizá empresas que probablemente YA TENGAN presencia digital completa (website profesional, redes activas, ecommerce). No busques PyMEs chicas.

REGLAS:
- Solo empresas reales y verificables — no inventes datos
- Si no encontrás un campo, usá null
- Priorizá marcas reconocidas sobre emprendimientos nuevos

Respondé ÚNICAMENTE con JSON puro:
{
  "query": "${query}",
  "companies": [
    {
      "nombreEmpresa": "Nombre real",
      "website": "https://... o null",
      "instagram": "https://instagram.com/handle o null",
      "telefono": "+54... o null",
      "ciudad": "Ciudad, País",
      "rubro": "Descripción específica del rubro",
      "descripcion": "Una oración o null"
    }
  ]
}`;

  const raw = await spawnClaude(prompt);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Discovery: no JSON en respuesta');
  const parsed = JSON.parse(match[0]);
  const companies: DiscoveredCompany[] = parsed.companies ?? [];
  console.log(`[Discovery] Encontradas: ${companies.length} empresas`);
  return companies;
}

async function auditPresence(company: DiscoveredCompany): Promise<{ problems: string[]; yaResueltos: string[] }> {
  const hasWeb = Boolean(company.website);
  const hasIG = Boolean(company.instagram);

  if (!hasWeb && !hasIG) {
    return {
      problems: ['Sin ninguna presencia digital', 'Sin sitio web', 'Sin perfil de Google Business detectado'],
      yaResueltos: [],
    };
  }

  const prompt = `Sos un auditor de presencia digital para Inspyra Digital, agencia argentina.

EMPRESA: ${company.nombreEmpresa}
Rubro: ${company.rubro}
Ciudad: ${company.ciudad}
Website: ${company.website ?? 'No tiene'}
Instagram: ${company.instagram ?? 'No tiene'}

CONTEXTO IMPORTANTE: Esta es una empresa MADURA y CONSOLIDADA. Tiene presencia digital profesional.
Tu tarea es detectar brechas REALES — no exageres ni fuerces problemas donde no los hay.

TU TAREA — máximo 4 herramientas:
${company.website ? `1. WebFetch ${company.website} → analizá conversión, ecommerce, SEO, velocidad, CTA` : ''}
${company.instagram ? `${company.website ? '2' : '1'}. WebFetch ${company.instagram} → frecuencia, engagement, canal de venta` : ''}
${(hasWeb || hasIG) ? `${[company.website, company.instagram].filter(Boolean).length + 1}. WebSearch "${company.nombreEmpresa} google maps reviews" → GBP reclamado` : ''}

CRITERIO DE REPORTE — solo reportá problemas que sean TODOS:
  1. Verificables (vos los confirmaste — no asumas)
  2. Comercialmente impactantes en ventas directas
  3. Que INSPYRA Digital podría resolver (web, SEO, ecommerce, GBP, social media, hosting)

SI la empresa YA TIENE algo bien implementado (web profesional, ecommerce funcional, GBP activo, etc.),
escribilo en "yaResueltos" — NO lo reportes como problema.

PROBLEMAS que INSPYRA NO resuelve (no los reportes como problemas):
- Software propio / producto digital / bugs de código
- CRM, ERP, channel manager, PMS hotelero, sistema de reservas
- Estrategia de pricing o revenue management
- Logística, supply chain, RRHH
- WhatsApp Business, email marketing automation

Respondé ÚNICAMENTE con JSON:
{
  "problemasDetectados": [
    "Problema verificado 1 — descripción concisa",
    "Problema verificado 2"
  ],
  "yaResueltos": [
    "Tiene website profesional con ecommerce",
    "GBP reclamado con reseñas activas"
  ],
  "tieneWeb": true,
  "tieneGBP": false,
  "notasExtra": "observación en 1 oración"
}`;

  try {
    const raw = await spawnClaude(prompt, 60_000, 180_000);
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return { problems: ['Sin datos suficientes para auditar'], yaResueltos: [] };
    const data = JSON.parse(m[0]);
    return {
      problems: data.problemasDetectados ?? [],
      yaResueltos: data.yaResueltos ?? [],
    };
  } catch (e) {
    console.warn(`  [Audit] Error en ${company.nombreEmpresa}: ${(e as Error).message.slice(0, 80)}`);
    return { problems: ['Sin datos suficientes para auditar'], yaResueltos: [] };
  }
}

function score052(problems: string[], ctx: { hasWebsite: boolean; hasInstagram: boolean; hasLinkedIn: boolean }) {
  if (problems.length === 0) return { result: 'DISCARDED', reason: 'INSUFFICIENT_DATA', score: 0, best: null, allMatches: [] };
  const allMatches = findAllServiceMatches(problems, INSPYRA_SERVICE_IDS);
  if (allMatches.length === 0) return { result: 'DISCARDED', reason: 'NO_SERVICE_MATCH', score: 0, best: null, allMatches: [] };
  const best = findBestServiceMatch(allMatches);
  const s = Math.min(
    MATCH_TYPE_SCORE[best.matchType] + IMPACT_SCORE[best.businessImpact] + calcContactability({ ...ctx, hasContactPoint: true }),
    100,
  );
  return { result: 'PENDING', reason: null, score: s, best, allMatches };
}

async function runSector(query: string, sector: string) {
  const companies = await discoverCompanies(query, sector);
  if (companies.length === 0) { console.warn(`[Warn] Discovery devolvió 0 empresas para: ${sector}`); return []; }

  type Result = {
    empresa: string; rubro: string;
    website: string | null; instagram: string | null;
    problems: string[]; yaResueltos: string[];
    score: number; resultado: string; motivo: string | null;
    bestService: string | null; matchType: string | null; businessImpact: string | null;
    contactScore: number;
  };

  const results: Result[] = [];

  for (let i = 0; i < companies.length; i++) {
    const c = companies[i];
    console.log(`\n[${i + 1}/${companies.length}] ${c.nombreEmpresa}…`);
    const { problems, yaResueltos } = await auditPresence(c);
    console.log(`  Problemas: ${problems.length}  |  Ya resueltos: ${yaResueltos.length}`);

    const ctx = { hasWebsite: Boolean(c.website), hasInstagram: Boolean(c.instagram), hasLinkedIn: false };
    const scoring = score052(problems, ctx);
    const contactScore = calcContactability({ ...ctx, hasContactPoint: Boolean(c.telefono) });
    const bestSvcName = scoring.best ? (SIR_CATALOG.find(s => s.id === scoring.best!.serviceId)?.name ?? scoring.best.serviceId) : null;

    console.log(`  → ${scoring.result}${scoring.reason ? ` (${scoring.reason})` : ` | ${bestSvcName} | Score: ${scoring.score}`}`);

    results.push({
      empresa: c.nombreEmpresa, rubro: c.rubro,
      website: c.website, instagram: c.instagram,
      problems, yaResueltos,
      score: scoring.score, resultado: scoring.result, motivo: scoring.reason,
      bestService: bestSvcName, matchType: scoring.best?.matchType ?? null, businessImpact: scoring.best?.businessImpact ?? null,
      contactScore,
    });

    if (i < companies.length - 1) await new Promise(r => setTimeout(r, 1500));
  }

  return results;
}

async function main() {
  console.log('\n' + '═'.repeat(100));
  console.log('ERP-052 — E2E Rubros Maduros · Validación de Gate NO_SERVICE_MATCH');
  console.log('Sectores: Bodegas Premium + Hoteles Boutique');
  console.log('Objetivo: confirmar que empresas con presencia digital completa → DISCARDED');
  console.log('DRY_RUN: SÍ — sin escritura en DB');
  console.log('═'.repeat(100));

  const allResults: Array<{ empresa: string; rubro: string; website: string | null; instagram: string | null; problems: string[]; yaResueltos: string[]; score: number; resultado: string; motivo: string | null; bestService: string | null; matchType: string | null; businessImpact: string | null; contactScore: number }> = [];

  // Sector 1: Bodegas premium
  console.log('\n\n── SECTOR 1: BODEGAS PREMIUM ──────────────────────────────────────────────────');
  const bodegas = await runSector('bodegas vino premium exportación Argentina', 'bodegas de vino premium de exportación');
  allResults.push(...bodegas);

  // Sector 2: Hoteles boutique
  console.log('\n\n── SECTOR 2: HOTELES BOUTIQUE PREMIUM ─────────────────────────────────────────');
  const hoteles = await runSector('hoteles boutique lujo premium Mendoza Argentina', 'hoteles boutique de lujo premium');
  allResults.push(...hoteles);

  // Ranking y reporte final
  allResults.sort((a, b) => b.score - a.score);

  const pending = allResults.filter(r => r.resultado === 'PENDING');
  const discarded = allResults.filter(r => r.resultado === 'DISCARDED');
  const noMatch = discarded.filter(r => r.motivo === 'NO_SERVICE_MATCH');
  const noData = discarded.filter(r => r.motivo === 'INSUFFICIENT_DATA');

  console.log('\n\n' + '═'.repeat(100));
  console.log('RESULTADOS COMPLETOS:');
  console.log('═'.repeat(100));

  allResults.forEach((r, i) => {
    const matchPts = MATCH_TYPE_SCORE[r.matchType as keyof typeof MATCH_TYPE_SCORE] ?? 0;
    const impactPts = IMPACT_SCORE[r.businessImpact as keyof typeof IMPACT_SCORE] ?? 0;
    console.log(`\n[${(i + 1).toString().padStart(2)}] ${r.empresa} · ${r.rubro}`);
    if (r.resultado === 'DISCARDED') {
      console.log(`     ► DISCARDED (${r.motivo})`);
      if (r.problems.length > 0) console.log(`     Problemas detectados (${r.problems.length}): ${r.problems.slice(0, 2).join(' | ')}`);
      if (r.yaResueltos.length > 0) console.log(`     Ya resueltos: ${r.yaResueltos.slice(0, 2).join(' | ')}`);
    } else {
      console.log(`     Mejor match: ${r.bestService}`);
      console.log(`     Match Type:  ${r.matchType} (${matchPts} pts) · Impact: ${r.businessImpact} (${impactPts} pts) · Contactab: ${r.contactScore} pts`);
      console.log(`     Problemas (${r.problems.length}): ${r.problems.slice(0, 2).join(' | ')}`);
      console.log(`     SCORE FINAL: ${r.score}/100`);
    }
  });

  console.log('\n' + '═'.repeat(100));
  console.log(`RESUMEN GLOBAL: ${allResults.length} empresas procesadas`);
  console.log(`  PENDING:   ${pending.length} (${Math.round(pending.length / allResults.length * 100)}%) — califican para outreach`);
  console.log(`  DISCARDED: ${discarded.length} (${Math.round(discarded.length / allResults.length * 100)}%)`);
  console.log(`    ↳ NO_SERVICE_MATCH:  ${noMatch.length}  — tienen presencia digital completa sin brechas INSPYRA`);
  console.log(`    ↳ INSUFFICIENT_DATA: ${noData.length}  — no se pudo auditar`);

  if (pending.length > 0) {
    const avg = Math.round(pending.reduce((s, r) => s + r.score, 0) / pending.length);
    console.log(`  Score promedio PENDING: ${avg}`);
  }

  // Problemas sin match (información sobre gaps del catálogo en rubros maduros)
  const unmatched = allResults.flatMap(r => r.problems.filter(p => findAllServiceMatches([p], INSPYRA_SERVICE_IDS).length === 0));
  const unmatchedFreq = new Map<string, number>();
  unmatched.forEach(p => unmatchedFreq.set(p, (unmatchedFreq.get(p) ?? 0) + 1));
  const unmatchedSorted = [...unmatchedFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  if (unmatchedSorted.length > 0) {
    console.log(`\nProblemas sin match en rubros maduros (top ${unmatchedSorted.length}) — confirmando que el gate rechaza correctamente:`);
    unmatchedSorted.forEach(([p, n]) => console.log(`  ${String(n).padStart(2)}x  "${p}"`));
  }

  // Evaluación del gate
  console.log('\n' + '─'.repeat(100));
  const discardRate = Math.round(discarded.length / allResults.length * 100);
  if (discardRate >= 30) {
    console.log(`✓ GATE VALIDADO: ${discardRate}% de empresas maduras fueron descartadas — NO_SERVICE_MATCH funciona correctamente`);
  } else {
    console.log(`⚠ GATE DÉBIL: solo ${discardRate}% descartadas — el catálogo matchea demasiado amplio en rubros maduros`);
    console.log(`  Considerar: revisar si los patrones de ecommerce/web/seo son demasiado permisivos`);
  }
  console.log('');
}

main().catch(console.error);
