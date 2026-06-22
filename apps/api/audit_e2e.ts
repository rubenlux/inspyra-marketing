import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const jobId = '4329f9d8-b10c-450b-83e8-ec01d41fb407';

  // FASE 1: Estado del Job
  const job = await prisma.researchJob.findUnique({
    where: { id: jobId },
    include: { candidates: true }
  });

  if (!job) {
    console.log('JOB_NOT_FOUND');
    await prisma.$disconnect();
    return;
  }

  console.log('\n=== FASE 1: ESTADO DEL JOB ===');
  console.log(JSON.stringify({
    id: job.id,
    status: job.status,
    sourceType: job.sourceType,
    errorMessage: job.errorMessage,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    candidatesFound: job.candidatesFound,
    prospectsFound: job.prospectsFound,
  }, null, 2));

  // FASE 2: Candidatos pendientes
  console.log('\n=== FASE 2: CANDIDATOS POR STATUS ===');
  const byStatus: Record<string, string[]> = {};
  for (const c of job.candidates) {
    if (!byStatus[c.status]) byStatus[c.status] = [];
    byStatus[c.status].push(c.name || c.googlePlaceId || c.id);
  }

  for (const [status, names] of Object.entries(byStatus)) {
    console.log(`\n[${status}] (${names.length}):`);
    names.forEach(n => console.log(`  - ${n}`));
  }

  // Summary table
  console.log('\n=== TABLA CANDIDATOS ===');
  console.log('Empresa | Status | Score | Action');
  for (const c of job.candidates) {
    const score = (c as any).opportunityScore ?? 'N/A';
    const action = (c as any).evaluationAction ?? 'N/A';
    console.log(`${c.name || 'N/A'} | ${c.status} | ${score} | ${action}`);
  }

  // FASE 5 Preview: Stats
  console.log('\n=== STATS ===');
  console.log(JSON.stringify({
    total: job.candidates.length,
    DISCOVERED: job.candidates.filter(c => c.status === 'DISCOVERED').length,
    EVALUATING: job.candidates.filter(c => c.status === 'EVALUATING').length,
    PROMOTED: job.candidates.filter(c => c.status === 'PROMOTED').length,
    DISCARDED: job.candidates.filter(c => c.status === 'DISCARDED').length,
  }, null, 2));

  // Sample candidate structure
  if (job.candidates.length > 0) {
    console.log('\n=== SAMPLE CANDIDATE (keys) ===');
    console.log(Object.keys(job.candidates[0]).join(', '));
    console.log('\n=== SAMPLE CANDIDATE (first) ===');
    console.log(JSON.stringify(job.candidates[0], null, 2));
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
