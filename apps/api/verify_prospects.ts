import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const jobId = '974d257a-5530-476f-b053-376f04f58a6c';

  const candidates = await prisma.researchCandidate.findMany({
    where: { jobId },
    orderBy: { score: 'desc' },
  });

  const prospectIds = candidates.map(c => c.prospectId).filter(Boolean) as string[];
  const prospects = await prisma.prospect.findMany({
    where: { id: { in: prospectIds } },
    select: { id: true, estado: true, currentProblems: true, nombreEmpresa: true },
  });
  const prospectMap = new Map(prospects.map(p => [p.id, p]));

  let withProspect = 0;
  let withoutProspect = 0;

  console.log('\n=== VERIFICACIÓN PROSPECTS EN DB ===');
  console.log('Empresa | CandidateStatus | ProspectId | Estado | currentProblems');
  for (const c of candidates) {
    const pros = c.prospectId ? prospectMap.get(c.prospectId) : null;
    if (pros) withProspect++;
    else withoutProspect++;
    const problems = (pros as any)?.currentProblems;
    const problemsStr = Array.isArray(problems) ? problems.join(', ') : 'NULL';
    console.log(`${c.nombreEmpresa} | ${c.status} | ${c.prospectId || 'NULL'} | ${(pros as any)?.estado || 'N/A'} | [${problemsStr}]`);
  }

  console.log(`\nCon prospecto: ${withProspect} | Sin prospecto: ${withoutProspect}`);

  // Check if any prospect has null currentProblems (the old bug)
  const brokenProspects = prospects.filter(p => {
    const problems = (p as any).currentProblems;
    return problems === null || problems === undefined;
  });

  if (brokenProspects.length > 0) {
    console.log(`\n⚠️  PROSPECTOS CON currentProblems NULL: ${brokenProspects.map(p => p.nombreEmpresa).join(', ')}`);
  } else {
    console.log('\n✅ Todos los prospectos tienen currentProblems inicializado correctamente');
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
