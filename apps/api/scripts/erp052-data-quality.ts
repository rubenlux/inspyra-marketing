/**
 * ERP-052 — Calidad de datos: antes vs después de ERP-049D
 * Cutoff: 2026-06-17 (fix ERP-049D Google Maps Search vs Place + Discovery)
 * Clasifica qué tan representativos son los problemas de cada época.
 * No escribe nada en DB.
 */
import { PrismaClient } from '@prisma/client';
import {
  INSPYRA_SERVICE_IDS,
  findAllServiceMatches,
} from '../src/modules/service-intelligence/catalog';

const prisma = new PrismaClient();
const CUTOFF = new Date('2026-06-17T00:00:00-03:00');

function analyzeGroup(
  label: string,
  prospects: { nombreEmpresa: string | null; problemasEncontrados: string[] }[],
) {
  let totalProblems = 0;
  let totalMatched = 0;
  const unmatchedFreq = new Map<string, number>();

  for (const p of prospects) {
    for (const prob of p.problemasEncontrados ?? []) {
      totalProblems++;
      const m = findAllServiceMatches([prob], INSPYRA_SERVICE_IDS);
      if (m.length > 0) {
        totalMatched++;
      } else {
        unmatchedFreq.set(prob, (unmatchedFreq.get(prob) ?? 0) + 1);
      }
    }
  }

  const coveragePct = totalProblems > 0 ? Math.round((totalMatched / totalProblems) * 100) : 0;
  const top20 = [...unmatchedFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  console.log(`\n${'═'.repeat(90)}`);
  console.log(`${label}`);
  console.log(`Prospectos: ${prospects.length} · Problemas totales: ${totalProblems} · Con match: ${totalMatched} · Sin match: ${unmatchedFreq.size} únicos`);
  console.log(`Cobertura del catálogo: ${coveragePct}% (${totalMatched}/${totalProblems})`);
  console.log(`${'─'.repeat(90)}`);
  console.log(`Top 20 problemas SIN match:`);

  top20.forEach(([prob, count]) => {
    const bar = '█'.repeat(Math.min(count, 15));
    const truncated = prob.length > 80 ? prob.slice(0, 77) + '...' : prob;
    console.log(`  ${String(count).padStart(3)}x  ${bar.padEnd(15)}  "${truncated}"`);
  });

  if (unmatchedFreq.size > 20) {
    console.log(`  ... y ${unmatchedFreq.size - 20} problemas más (frecuencia 1x cada uno)`);
  }

  // Detectar señales de datos sucios
  console.log(`\n  ── Señales de calidad del dataset ──`);
  const problems = prospects.flatMap(p => p.problemasEncontrados ?? []);
  const veryLong = problems.filter(p => p.length > 100);
  const technicalAudit = problems.filter(p =>
    /xmlrpc|aria-label|meta.keywords|csrf|wp-json|dashboard|cookie.banner|X-Content-Type|alt text vacío|Permissions-Policy|Content-Security-Policy|HSTS|X-Frame/i.test(p),
  );
  const businessLevel = problems.filter(p =>
    /sin.*web|sin.*ecommerce|sin.*instagram|sin.*seo|sin.*google.business|presencia.*digital|sin.*tienda|sin.*sitio/i.test(p),
  );
  console.log(`  Problemas muy largos (>100 chars): ${veryLong.length}`);
  console.log(`  Auditoría técnica profunda (xmlrpc, CSP, aria, etc.): ${technicalAudit.length}`);
  console.log(`  Nivel comercial (web/ecommerce/seo/redes): ${businessLevel.length}`);
  console.log(`  Ratio comercial/técnico: ${totalProblems > 0 ? Math.round((businessLevel.length / totalProblems) * 100) : 0}% comerciales`);

  return { totalProblems, totalMatched, coveragePct, uniqueUnmatched: unmatchedFreq.size };
}

async function main() {
  const tenantId = '483e19af-46e0-480e-a4ea-5e8513216ef9';

  const all = await prisma.prospect.findMany({
    where: { tenantId, deletedAt: null },
    select: {
      nombreEmpresa: true,
      problemasEncontrados: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const before = all.filter(p => p.createdAt < CUTOFF && p.problemasEncontrados?.length > 0);
  const after  = all.filter(p => p.createdAt >= CUTOFF && p.problemasEncontrados?.length > 0);

  console.log(`\nCutoff: ${CUTOFF.toISOString().slice(0, 10)} (post ERP-049D Discovery fix)`);
  console.log(`Total prospectos: ${all.length} · Con problemas: ${before.length + after.length}`);
  console.log(`  ANTES cutoff: ${before.length} prospectos`);
  console.log(`  DESPUÉS cutoff: ${after.length} prospectos`);

  const statsA = analyzeGroup('REPORTE A — Antes de ERP-049D (2026-06-04 → 2026-06-16)', before);
  const statsB = analyzeGroup('REPORTE B — Después de ERP-049D (2026-06-17 → hoy)', after);

  console.log(`\n${'═'.repeat(90)}`);
  console.log('COMPARATIVA');
  console.log(`${'─'.repeat(90)}`);
  console.log(`                        ANTES       DESPUÉS`);
  console.log(`Prospectos:             ${String(before.length).padStart(5)}       ${after.length}`);
  console.log(`Problemas totales:      ${String(statsA.totalProblems).padStart(5)}       ${statsB.totalProblems}`);
  console.log(`Con match:              ${String(statsA.totalMatched).padStart(5)}       ${statsB.totalMatched}`);
  console.log(`Sin match (únicos):     ${String(statsA.uniqueUnmatched).padStart(5)}       ${statsB.uniqueUnmatched}`);
  console.log(`Cobertura catálogo:     ${String(statsA.coveragePct).padStart(4)}%       ${statsB.coveragePct}%`);
  console.log(`${'═'.repeat(90)}\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
