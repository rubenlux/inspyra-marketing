/**
 * ERP-052 — Trazabilidad completa: Azafrán
 * Re-audita azafranresto.com y muestra por qué cada problema matcheó (o no).
 *
 * Por cada problema:
 *   Problema detectado → Familia → Servicio → Match Type → Impacto → Contribución al score
 *
 * Uso: npx ts-node -r tsconfig-paths/register scripts/erp052-azafran-trace.ts
 */
import { spawn } from 'child_process';
import * as path from 'path';
import {
  INSPYRA_SERVICE_IDS,
  findBestServiceMatch,
  MATCH_TYPE_SCORE,
  IMPACT_SCORE,
  PROBLEM_MATCH_CATALOG,
  SIR_CATALOG,
  calcContactability,
} from '../src/modules/service-intelligence/catalog';
import type { ServiceMatchResult } from '../src/modules/service-intelligence/catalog';

const PROJECT_ROOT = path.resolve(__dirname, '../../../../..');

const FAMILY_LABEL: Record<string, string> = {
  'ecommerce':        'ECOMMERCE_MISSING',
  'web-new':          'WEB_MISSING',
  'web-redesign':     'WEB_OUTDATED',
  'landing-page':     'CTA_MISSING',
  'lead-capture':     'LEADS_MISSING',
  'gbp-management':   'GBP_MISSING',
  'seo-local':        'SEO_LOCAL',
  'seo-technical':    'SEO_TECHNICAL',
  'seo-schema':       'SEO_SCHEMA',
  'social-management':'SOCIAL_INACTIVE',
  'hostingguard':     'SECURITY_HOSTING',
};

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

async function auditAzafran(): Promise<{ problems: string[]; tieneGBP: boolean; nota: string }> {
  const prompt = `Sos un auditor de presencia digital para Inspyra Digital, agencia argentina.

EMPRESA: Azafrán — Restaurante de comida argentina moderna — Mendoza, Argentina
WEBSITE: https://azafranresto.com/
INSTAGRAM: no disponible

TU TAREA (máximo 4 herramientas en total):
1. WebFetch https://azafranresto.com/ → revisá si convierte, tiene ecommerce, menú online, CTA, horarios visibles, redes sociales
2. WebSearch "Azafrán restaurante Mendoza google maps reviews" → verificar GBP reclamado y reseñas
3. WebSearch "Azafrán restaurante Mendoza pedidos online reservas" → verificar canal de venta digital
4. WebSearch "Azafrán Mendoza instagram" → detectar presencia en redes

REGLAS:
- Reportá TODOS los problemas comerciales reales que impactan ventas (entre 3 y 7)
- NO omitas ningún problema aunque parezca menor — necesitamos la lista COMPLETA
- NO reportes problemas técnicos de HTML, código o accesibilidad
- Sé específico: en lugar de "falta SEO", decí "Sin posicionamiento para búsquedas de 'restaurante Mendoza'"

Respondé ÚNICAMENTE con JSON puro:
{
  "problemasDetectados": [
    "Problema 1 — descripción concisa y específica",
    "Problema 2",
    "Problema 3",
    "..."
  ],
  "tieneGBP": false,
  "tieneEcommerce": false,
  "notasExtra": "una observación clave en 1 oración"
}`;

  const raw = await spawnClaude(prompt);
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('No JSON en respuesta');
  const data = JSON.parse(m[0]);
  return {
    problems: data.problemasDetectados ?? [],
    tieneGBP: data.tieneGBP ?? false,
    nota: data.notasExtra ?? '',
  };
}

function traceAllProblems(problems: string[]): ServiceMatchResult[] {
  const allMatches: ServiceMatchResult[] = [];

  problems.forEach((problema, idx) => {
    console.log(`\n┌─ PROBLEMA #${idx + 1}`);
    console.log(`│  "${problema}"`);

    let matched = false;
    let ruleIdx = 0;
    for (const rule of PROBLEM_MATCH_CATALOG) {
      if (rule.pattern.test(problema)) {
        if (INSPYRA_SERVICE_IDS.has(rule.serviceId)) {
          const svcName = SIR_CATALOG.find(s => s.id === rule.serviceId)?.name ?? rule.serviceId;
          const familia = FAMILY_LABEL[rule.serviceId] ?? rule.serviceId.toUpperCase();
          const contribution = MATCH_TYPE_SCORE[rule.matchType] + IMPACT_SCORE[rule.businessImpact];
          console.log(`│  ► Familia:    ${familia}`);
          console.log(`│    Servicio:   ${svcName}`);
          console.log(`│    Match Type: ${rule.matchType}  (${MATCH_TYPE_SCORE[rule.matchType]} pts)`);
          console.log(`│    Impacto:    ${rule.businessImpact}  (${IMPACT_SCORE[rule.businessImpact]} pts)`);
          console.log(`│    Contribución al score: ${contribution} pts`);
          allMatches.push({ serviceId: rule.serviceId, problema, matchType: rule.matchType, businessImpact: rule.businessImpact });
          matched = true;
          break;
        }
      }
      ruleIdx++;
    }

    if (!matched) {
      console.log(`│  ► Sin match — fuera del scope de servicios INSPYRA`);
      console.log(`│    (CRM, reservas, email marketing, etc. no están en el catálogo)`);
    }
    console.log('└' + '─'.repeat(99));
  });

  return allMatches;
}

async function main() {
  console.log('\n' + '═'.repeat(100));
  console.log('ERP-052 — Trazabilidad completa · Azafrán · azafranresto.com');
  console.log('Objetivo: verificar por qué cada problema matcheó (o no) y por qué ganó el mejor match');
  console.log('═'.repeat(100));

  console.log('\n[Auditando con WebFetch + WebSearch — puede tardar ~60s...]');
  const { problems, tieneGBP, nota } = await auditAzafran();

  console.log(`\nProblemas detectados: ${problems.length}  |  GBP: ${tieneGBP ? 'sí' : 'no'}  |  Nota: ${nota}`);
  console.log('\n' + '─'.repeat(100));
  console.log('TRAZA POR PROBLEMA:');

  const ctx = { hasWebsite: true, hasInstagram: false, hasLinkedIn: false };
  const allMatches = traceAllProblems(problems);

  console.log('\n' + '═'.repeat(100));
  console.log('RANKING DE TODOS LOS MATCHES:');

  if (allMatches.length === 0) {
    console.log('\n  → DISCARDED: NO_SERVICE_MATCH — ningún problema mapea a un servicio INSPYRA');
    return;
  }

  const ranked = [...allMatches].sort((a, b) => {
    const sa = MATCH_TYPE_SCORE[a.matchType] + IMPACT_SCORE[a.businessImpact];
    const sb = MATCH_TYPE_SCORE[b.matchType] + IMPACT_SCORE[b.businessImpact];
    return sb - sa;
  });

  ranked.forEach((m, i) => {
    const svcName = SIR_CATALOG.find(s => s.id === m.serviceId)?.name ?? m.serviceId;
    const sc = MATCH_TYPE_SCORE[m.matchType] + IMPACT_SCORE[m.businessImpact];
    const tag = i === 0 ? ' ◄ GANADOR' : '';
    console.log(`\n  [${i + 1}] ${svcName}${tag}`);
    console.log(`       Match Type: ${m.matchType}  (${MATCH_TYPE_SCORE[m.matchType]} pts)`);
    console.log(`       Impacto:    ${m.businessImpact}  (${IMPACT_SCORE[m.businessImpact]} pts)`);
    console.log(`       Total:      ${sc} pts`);
    console.log(`       Problema:   "${m.problema.slice(0, 90)}${m.problema.length > 90 ? '...' : ''}"`);
  });

  const best = findBestServiceMatch(allMatches);
  const bestSvc = SIR_CATALOG.find(s => s.id === best.serviceId)?.name ?? best.serviceId;
  const bestScore = MATCH_TYPE_SCORE[best.matchType] + IMPACT_SCORE[best.businessImpact];
  const contactScore = calcContactability({ ...ctx, hasContactPoint: true });
  const finalScore = Math.min(bestScore + contactScore, 100);

  console.log('\n' + '═'.repeat(100));
  console.log('CONCLUSIÓN:');
  console.log(`  Mejor match: ${bestSvc}  (${best.serviceId})`);
  console.log(`  Match Type:  ${best.matchType}  →  ${MATCH_TYPE_SCORE[best.matchType]} pts`);
  console.log(`  Impacto:     ${best.businessImpact}  →  ${IMPACT_SCORE[best.businessImpact]} pts`);
  console.log(`  Contactab:   ${contactScore} pts  (web: sí / IG: no / LinkedIn: no / tel: asumido)`);
  console.log(`  SCORE FINAL: ${finalScore}/100`);

  if (ranked.length > 1) {
    const runnerUp = ranked[1];
    const ruSvc = SIR_CATALOG.find(s => s.id === runnerUp.serviceId)?.name ?? runnerUp.serviceId;
    const ruScore = MATCH_TYPE_SCORE[runnerUp.matchType] + IMPACT_SCORE[runnerUp.businessImpact];
    console.log(`\n  Por qué ${bestSvc} ganó sobre ${ruSvc}:`);
    console.log(`    ${bestScore} pts > ${ruScore} pts  (diferencia: +${bestScore - ruScore} pts)`);
    console.log(`    ${best.matchType} + ${best.businessImpact}  vs  ${runnerUp.matchType} + ${runnerUp.businessImpact}`);
  }
  console.log('\n' + '═'.repeat(100) + '\n');
}

main().catch(console.error);
