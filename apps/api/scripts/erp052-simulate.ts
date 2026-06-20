/**
 * ERP-052 — Simulación en datos reales
 * Corre el motor Service Match First sobre prospectos existentes, SIN escribir a la DB.
 * Uso: npx ts-node -r tsconfig-paths/register scripts/erp052-simulate.ts
 */
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

const IMPACT_TO_PRIORIDAD: Record<string, string> = {
  CRITICAL: 'ALTA', HIGH: 'ALTA', MEDIUM: 'MEDIA', LOW: 'BAJA',
};

function calcScore(bestMatch: ReturnType<typeof findBestServiceMatch>, ctx: { hasWebsite: boolean; hasInstagram: boolean; hasLinkedIn: boolean }): number {
  return Math.min(
    MATCH_TYPE_SCORE[bestMatch.matchType] +
    IMPACT_SCORE[bestMatch.businessImpact] +
    calcContactability({ ...ctx, hasContactPoint: true }),
    100,
  );
}

async function main() {
  // Obtener los primeros tenantId disponible
  const firstTenant = await prisma.tenant.findFirst({ select: { id: true, name: true } });
  if (!firstTenant) { console.error('No tenants found'); return; }

  const tenantId = firstTenant.id;
  console.log(`\nTenant: ${firstTenant.name} (${tenantId})\n`);

  // Traer prospectos con problemas detectados
  const prospects = await prisma.prospect.findMany({
    where: {
      tenantId,
      deletedAt: null,
      isLegacy: false,
      OR: [
        { problemasEncontrados: { isEmpty: false } },
      ],
    },
    select: {
      id: true,
      nombreEmpresa: true,
      rubro: true,
      ciudad: true,
      pais: true,
      problemasEncontrados: true,
      website: true,
      instagram: true,
      linkedin: true,
      score: true,
    },
    take: 30, // traemos más para filtrar los que tienen problemas
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Prospectos con problemas encontrados: ${prospects.filter(p => p.problemasEncontrados?.length > 0).length} de ${prospects.length} totales\n`);

  const withProblems = prospects.filter(p => p.problemasEncontrados?.length > 0);

  type Row = {
    empresa: string;
    sector: string;
    problemas: string[];
    match: string;
    matchType: string;
    businessImpact: string;
    contactScore: number;
    score: number;
    resultado: string;
    motivo: string;
  };

  const rows: Row[] = [];

  for (const p of withProblems) {
    const problems: string[] = (p as unknown as { currentProblems?: string[] }).currentProblems?.length
      ? (p as unknown as { currentProblems: string[] }).currentProblems
      : (p.problemasEncontrados ?? []);

    const ctx = buildProspectContext(p as never);
    const contactScore = calcContactability({ ...ctx, hasContactPoint: true });

    if (problems.length === 0) {
      rows.push({
        empresa: p.nombreEmpresa ?? '?',
        sector: p.rubro ?? '?',
        problemas: [],
        match: '—',
        matchType: '—',
        businessImpact: '—',
        contactScore,
        score: 0,
        resultado: 'DISCARDED',
        motivo: 'INSUFFICIENT_DATA',
      });
      continue;
    }

    const allMatches = findAllServiceMatches(problems, INSPYRA_SERVICE_IDS);

    if (allMatches.length === 0) {
      rows.push({
        empresa: p.nombreEmpresa ?? '?',
        sector: p.rubro ?? '?',
        problemas: problems,
        match: '—',
        matchType: '—',
        businessImpact: '—',
        contactScore,
        score: 0,
        resultado: 'DISCARDED',
        motivo: 'NO_SERVICE_MATCH',
      });
      continue;
    }

    const bestMatch = findBestServiceMatch(allMatches);
    const score = calcScore(bestMatch, ctx);
    const svcName = SIR_CATALOG.find(s => s.id === bestMatch.serviceId)?.name ?? bestMatch.serviceId;

    rows.push({
      empresa: p.nombreEmpresa ?? '?',
      sector: p.rubro ?? '?',
      problemas: problems,
      match: svcName,
      matchType: bestMatch.matchType,
      businessImpact: bestMatch.businessImpact,
      contactScore,
      score,
      resultado: 'PENDING',
      motivo: `${allMatches.length} match(es)`,
    });
  }

  // Ordenar por score DESC
  rows.sort((a, b) => b.score - a.score);

  // ── Tabla ─────────────────────────────────────────────────────────────────
  const take = rows.slice(0, 10);

  console.log('═'.repeat(120));
  console.log('ERP-052 Service Match First — Simulación sobre datos reales');
  console.log('═'.repeat(120));

  take.forEach((r, i) => {
    console.log(`\n[${i + 1}] ${r.empresa} · ${r.sector}`);
    console.log(`    Problemas (${r.problemas.length}): ${r.problemas.slice(0, 3).join(' | ') || '—'}`);
    console.log(`    Mejor match: ${r.match}`);
    console.log(`    Match Type:  ${r.matchType}  (${MATCH_TYPE_SCORE[r.matchType as keyof typeof MATCH_TYPE_SCORE] ?? 0} pts)`);
    console.log(`    Biz Impact:  ${r.businessImpact}  (${IMPACT_SCORE[r.businessImpact as keyof typeof IMPACT_SCORE] ?? 0} pts)`);
    console.log(`    Contactab:   ${r.contactScore} pts`);
    console.log(`    SCORE FINAL: ${r.score}/100`);
    console.log(`    Resultado:   ${r.resultado}  (${r.motivo})`);
  });

  console.log('\n' + '═'.repeat(120));

  // Resumen PENDING vs DISCARDED
  const pending = rows.filter(r => r.resultado === 'PENDING');
  const discarded = rows.filter(r => r.resultado === 'DISCARDED');
  const noMatch = discarded.filter(r => r.motivo === 'NO_SERVICE_MATCH');
  const noData = discarded.filter(r => r.motivo === 'INSUFFICIENT_DATA');

  console.log(`\nRESUMEN — ${rows.length} prospectos procesados:`);
  console.log(`  PENDING:    ${pending.length}`);
  console.log(`  DISCARDED:  ${discarded.length} (NO_SERVICE_MATCH: ${noMatch.length}, INSUFFICIENT_DATA: ${noData.length})`);
  console.log(`\nScore más alto:  ${rows[0]?.score ?? 0} — ${rows[0]?.empresa ?? '?'}`);
  console.log(`Score más bajo:  ${rows[rows.length - 1]?.score ?? 0} — ${rows[rows.length - 1]?.empresa ?? '?'}`);
  if (pending.length > 0) {
    const avg = Math.round(pending.reduce((s, r) => s + r.score, 0) / pending.length);
    console.log(`Score promedio (PENDING): ${avg}`);
  }

  // ── Mostrar TODOS los problems que no matchearon (para detectar falsos negativos)
  const unmatchedProblems = new Set<string>();
  for (const p of withProblems) {
    const problems: string[] = (p as unknown as { currentProblems?: string[] }).currentProblems?.length
      ? (p as unknown as { currentProblems: string[] }).currentProblems
      : (p.problemasEncontrados ?? []);
    for (const prob of problems) {
      const matched = findAllServiceMatches([prob], INSPYRA_SERVICE_IDS);
      if (matched.length === 0) unmatchedProblems.add(prob);
    }
  }

  if (unmatchedProblems.size > 0) {
    console.log(`\n── Problemas SIN match en el catálogo (${unmatchedProblems.size} únicos) ──`);
    [...unmatchedProblems].slice(0, 20).forEach(p => console.log(`  · "${p}"`));
  }

  console.log('');
}

main().catch(console.error).finally(() => prisma.$disconnect());
