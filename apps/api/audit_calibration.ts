import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const jobId = '974d257a-5530-476f-b053-376f04f58a6c';

  const candidates = await prisma.researchCandidate.findMany({
    where: { jobId },
    orderBy: { score: 'desc' },
  });

  console.log('=== ANÁLISIS DE CALIBRACIÓN ERP-052 ===\n');
  console.log('Empresa | Score | Breakdown | Problemas | Servicio');
  console.log('-'.repeat(120));

  for (const c of candidates) {
    const bd = c.scoreBreakdown as Record<string, number> | null;
    const bdStr = bd ? Object.entries(bd).map(([k,v]) => `${k}:${v}`).join(' ') : 'N/A';
    const probs = Array.isArray(c.problemasDetectados) ? (c.problemasDetectados as string[]).join(', ') : 'N/A';
    console.log(`\n[${c.score}] ${c.nombreEmpresa}`);
    console.log(`  Breakdown : ${bdStr}`);
    console.log(`  Problemas : ${probs}`);
    console.log(`  Servicio  : ${c.servicioSugerido}`);
    console.log(`  Ticket    : $${c.estimatedTicketUsd}`);
    console.log(`  Reasoning : ${c.reasoning}`);
  }

  // Distribución de scores
  console.log('\n=== DISTRIBUCIÓN DE SCORES ===');
  const scoreGroups: Record<string, string[]> = {
    '>=85': [], '75-84': [], '65-74': [], '60-64': [], '<60': []
  };
  for (const c of candidates) {
    const s = c.score ?? 0;
    if (s >= 85) scoreGroups['>=85'].push(c.nombreEmpresa!);
    else if (s >= 75) scoreGroups['75-84'].push(c.nombreEmpresa!);
    else if (s >= 65) scoreGroups['65-74'].push(c.nombreEmpresa!);
    else if (s >= 60) scoreGroups['60-64'].push(c.nombreEmpresa!);
    else scoreGroups['<60'].push(c.nombreEmpresa!);
  }
  for (const [range, names] of Object.entries(scoreGroups)) {
    console.log(`${range}: ${names.length} → ${names.join(', ')}`);
  }

  // ¿Cuántas con agenda score?
  const conAgenda = candidates.filter(c => {
    const bd = c.scoreBreakdown as Record<string, number> | null;
    return bd && (bd['sinAgenda'] ?? 0) > 0;
  });
  const sinAgenda = candidates.filter(c => {
    const bd = c.scoreBreakdown as Record<string, number> | null;
    return bd && (bd['sinAgenda'] ?? 0) === 0;
  });
  console.log(`\nCon sinAgenda>0: ${conAgenda.length}`);
  console.log(`Sin bonif agenda: ${sinAgenda.length}`);

  // Hipótesis: ¿cuántas pasarían threshold=75?
  const above75 = candidates.filter(c => (c.score ?? 0) >= 75);
  const between60_74 = candidates.filter(c => {
    const s = c.score ?? 0;
    return s >= 60 && s < 75;
  });
  console.log(`\nSi threshold fuera 75: ${above75.length} promovidas, ${between60_74.length} descartadas`);
  console.log('Descartadas con threshold=75:');
  between60_74.forEach(c => console.log(`  - ${c.nombreEmpresa} (${c.score})`));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
