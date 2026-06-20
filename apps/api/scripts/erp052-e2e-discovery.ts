/**
 * ERP-052 — End-to-end Discovery Real
 * 1. Spawn Claude → descubre restaurantes en Mendoza vía WebSearch
 * 2. Para cada empresa con web o Instagram → spawn Claude → detecta problemas reales
 * 3. Aplica ERP-052 Service Match First
 * 4. Guarda en DB como prospectos limpios (isLegacy = false)
 * 5. Muestra Top 10 rankeados por score
 *
 * Uso: npx ts-node -r tsconfig-paths/register scripts/erp052-e2e-discovery.ts
 */
import { spawn } from 'child_process';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
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

const prisma = new PrismaClient();
const TENANT_ID = '483e19af-46e0-480e-a4ea-5e8513216ef9';
const PROJECT_ROOT = path.resolve(__dirname, '../../../../..');

// Dry-run por defecto. Pasar --persist para guardar en DB.
// Nada se escribe hasta que el Top 10 pase revisión humana.
const DRY_RUN = !process.argv.includes('--persist');

// ── Spawn Claude agentic (mismo patrón que el pipeline interno) ───────────────
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

// ── Step 1: Discovery ──────────────────────────────────────────────────────────
interface DiscoveredCompany {
  nombreEmpresa: string;
  website: string | null;
  instagram: string | null;
  telefono: string | null;
  ciudad: string;
  rubro: string;
  descripcion: string | null;
}

async function discoverRestaurants(query: string): Promise<DiscoveredCompany[]> {
  console.log(`\n[Discovery] Buscando: "${query}"…`);

  const prompt = `Sos un agente de extracción de datos para Inspyra Digital, agencia argentina de servicios digitales.

TU TAREA: Encontrá restaurantes y locales gastronómicos reales en "${query}".

INSTRUCCIONES:
1. Usá WebSearch con términos como "restaurantes ${query}", "mejores restaurantes ${query}", "parrillas ${query}", "gastronomia ${query}"
2. Extraé entre 15 y 25 negocios reales con sus datos
3. Buscá: nombre real del negocio, website (si tienen), instagram (si tienen), teléfono, ciudad, rubro específico

REGLAS:
- Solo negocios reales — no inventes datos
- Si no encontrás un campo, usá null
- Incluí variedad: restaurantes, parrillas, pizzerías, cafés, heladerías, bares

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
      "rubro": "Tipo de local gastronómico",
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

// ── Step 2: Audit de presencia digital ────────────────────────────────────────
async function auditPresence(company: DiscoveredCompany): Promise<string[]> {
  const hasWeb = Boolean(company.website);
  const hasIG = Boolean(company.instagram);

  if (!hasWeb && !hasIG) {
    // Sin presencia digital detectada en discovery → problemas inferidos
    return [
      'Sin ninguna presencia digital',
      'Sin sitio web',
      'Sin perfil de Google Business detectado',
    ];
  }

  const prompt = `Sos un auditor de presencia digital para Inspyra Digital, agencia argentina.

EMPRESA A AUDITAR:
- Nombre: ${company.nombreEmpresa}
- Rubro: ${company.rubro}
- Ciudad: ${company.ciudad}
- Website: ${company.website ?? 'No tiene'}
- Instagram: ${company.instagram ?? 'No tiene'}

TU TAREA — máximo 3 herramientas:
${company.website ? `1. WebFetch en ${company.website} → analizá si convierte, si tiene ecommerce, velocidad, SEO, redes, CTA` : ''}
${company.instagram ? `${company.website ? '2' : '1'}. WebFetch en ${company.instagram} → seguidores, frecuencia de posts, link en bio` : ''}
${company.website || company.instagram ? `${[company.website, company.instagram].filter(Boolean).length + 1}. WebSearch "${company.nombreEmpresa} ${company.ciudad} google maps" → verificar si tiene GBP reclamado` : ''}

DETECTÁ SOLO problemas comerciales reales con impacto en ventas. NO reportes problemas técnicos de HTML, accesibilidad o código.

Ejemplos de problemas válidos:
- "Sin ecommerce — ventas solo presenciales"
- "Sin Google Business reclamado"
- "Sin posicionamiento SEO local"
- "Web no convierte — sin CTA visible"
- "Redes sociales inactivas hace más de 3 meses"
- "Sin sitio web propio"
- "Instagram con X seguidores pero sin canal de venta propio"

Respondé ÚNICAMENTE con JSON:
{
  "problemasDetectados": [
    "Problema 1 — descripción concisa en español",
    "Problema 2",
    "..."
  ],
  "tieneWeb": true,
  "tieneInstagram": true,
  "tieneGBP": false,
  "seguidoresIG": 0,
  "notasExtra": "observación opcional en 1 oración"
}`;

  try {
    const raw = await spawnClaude(prompt, 60_000, 180_000);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return ['Sin datos suficientes para auditar'];
    const data = JSON.parse(match[0]);
    return data.problemasDetectados ?? [];
  } catch (e) {
    console.warn(`  [Audit] Error en ${company.nombreEmpresa}: ${(e as Error).message.slice(0, 80)}`);
    return ['Sin datos suficientes para auditar'];
  }
}

// ── Step 3: ERP-052 scoring ────────────────────────────────────────────────────
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

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const QUERY = 'restaurantes Mendoza Argentina';
  console.log('\n' + '═'.repeat(100));
  console.log(`ERP-052 — End-to-End Discovery Real | ${QUERY}`);
  console.log('═'.repeat(100));

  // Discovery
  const companies = await discoverRestaurants(QUERY);
  if (companies.length === 0) { console.error('Discovery devolvió 0 empresas'); return; }

  // Audit + Score (secuencial para no saturar rate limits)
  type Result = {
    empresa: string;
    rubro: string;
    website: string | null;
    instagram: string | null;
    problems: string[];
    score: number;
    resultado: string;
    motivo: string | null;
    bestService: string | null;
    matchType: string | null;
    businessImpact: string | null;
    contactScore: number;
    prospectId: string | null;
  };

  const results: Result[] = [];

  for (let i = 0; i < companies.length; i++) {
    const c = companies[i];
    console.log(`\n[${i + 1}/${companies.length}] Auditando: ${c.nombreEmpresa}…`);

    const problems = await auditPresence(c);
    console.log(`  Problemas detectados: ${problems.length}`);

    const ctx = {
      hasWebsite: Boolean(c.website),
      hasInstagram: Boolean(c.instagram),
      hasLinkedIn: false,
    };
    const scoring = score052(problems, ctx);
    const contactScore = calcContactability({ ...ctx, hasContactPoint: Boolean(c.telefono) });
    const bestSvcName = scoring.best ? (SIR_CATALOG.find(s => s.id === scoring.best!.serviceId)?.name ?? scoring.best.serviceId) : null;

    // Guardar en DB solo si --persist fue pasado explícitamente y el Top 10 fue aprobado
    let prospectId: string | null = null;
    if (!DRY_RUN) {
      try {
        const existing = await prisma.prospect.findFirst({
          where: { tenantId: TENANT_ID, deletedAt: null, nombreEmpresa: { equals: c.nombreEmpresa.trim(), mode: 'insensitive' } },
          select: { id: true },
        });
        if (existing) {
          prospectId = existing.id;
          console.log(`  [DB] Ya existe → ${prospectId}`);
        } else {
          const created = await prisma.prospect.create({
            data: {
              tenantId: TENANT_ID,
              nombreEmpresa: c.nombreEmpresa,
              rubro: c.rubro,
              ciudad: c.ciudad,
              website: c.website,
              instagram: c.instagram,
              telefono: c.telefono,
              problemasEncontrados: problems,
              fuente: 'GOOGLE_MAPS',
              detectadoPor: 'IA',
              estado: 'INVESTIGADO',
              score: scoring.score,
              isLegacy: false,
            } as never,
          });
          prospectId = created.id;
          console.log(`  [DB] Creado → ${prospectId} | Score ERP-052: ${scoring.score}`);
        }
      } catch (e) {
        console.warn(`  [DB] Error guardando: ${(e as Error).message.slice(0, 80)}`);
      }
    } else {
      console.log(`  [DRY-RUN] Score: ${scoring.score} | ${scoring.result}`);
    }

    results.push({
      empresa: c.nombreEmpresa,
      rubro: c.rubro,
      website: c.website,
      instagram: c.instagram,
      problems,
      score: scoring.score,
      resultado: scoring.result,
      motivo: scoring.reason,
      bestService: bestSvcName,
      matchType: scoring.best?.matchType ?? null,
      businessImpact: scoring.best?.businessImpact ?? null,
      contactScore,
      prospectId,
    });

    // Pequeña pausa entre audits para no saturar rate limits
    if (i < companies.length - 1) await new Promise(r => setTimeout(r, 1500));
  }

  // Ordenar y mostrar Top 10
  results.sort((a, b) => b.score - a.score);

  console.log('\n\n' + '═'.repeat(100));
  console.log('TOP 10 — ERP-052 Scoring Real · Sector Gastronómico · Mendoza');
  console.log('═'.repeat(100));

  results.slice(0, 10).forEach((r, i) => {
    const matchPts = MATCH_TYPE_SCORE[r.matchType as keyof typeof MATCH_TYPE_SCORE] ?? 0;
    const impactPts = IMPACT_SCORE[r.businessImpact as keyof typeof IMPACT_SCORE] ?? 0;
    console.log(`\n[${i + 1}] ${r.empresa} · ${r.rubro}`);
    console.log(`    Web: ${r.website ?? '—'} · IG: ${r.instagram ?? '—'}`);
    console.log(`    Problemas (${r.problems.length}): ${r.problems.slice(0, 2).join(' | ') || '—'}`);
    if (r.resultado === 'DISCARDED') {
      console.log(`    ► DISCARDED (${r.motivo})`);
    } else {
      console.log(`    Mejor match: ${r.bestService}`);
      console.log(`    Match Type:  ${r.matchType}  (${matchPts} pts)  ·  Impact: ${r.businessImpact}  (${impactPts} pts)  ·  Contactab: ${r.contactScore} pts`);
      console.log(`    SCORE FINAL: ${r.score}/100`);
    }
  });

  const pending = results.filter(r => r.resultado === 'PENDING');
  const discarded = results.filter(r => r.resultado === 'DISCARDED');
  console.log('\n' + '═'.repeat(100));
  console.log(`RESUMEN: ${results.length} empresas procesadas · ${pending.length} PENDING · ${discarded.length} DISCARDED`);
  if (pending.length > 0) {
    console.log(`Score promedio PENDING: ${Math.round(pending.reduce((s, r) => s + r.score, 0) / pending.length)}`);
    console.log(`Score máximo: ${results[0]?.score ?? 0} — ${results[0]?.empresa ?? '?'}`);
  }

  // Problemas sin match (falsos negativos)
  const unmatched = results.flatMap(r => r.problems.filter(p => findAllServiceMatches([p], INSPYRA_SERVICE_IDS).length === 0));
  const unmatchedSet = [...new Set(unmatched)].slice(0, 15);
  if (unmatchedSet.length > 0) {
    console.log(`\nProblemas sin match (muestra de ${unmatchedSet.length}):`);
    unmatchedSet.forEach(p => console.log(`  · "${p}"`));
  }
  console.log('');
}

main().catch(console.error).finally(() => prisma.$disconnect());
