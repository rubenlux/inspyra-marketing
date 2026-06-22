import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const jobId = '4329f9d8-b10c-450b-83e8-ec01d41fb407';

  const job = await prisma.researchJob.findUnique({
    where: { id: jobId }
  });

  if (!job) {
    console.log('JOB_NOT_FOUND');
    return;
  }

  const candidates = await prisma.researchCandidate.findMany({
    where: { jobId }
  });

  const prospects = await prisma.prospect.findMany({
    where: { 
        id: { in: candidates.map(c => c.prospectId).filter(id => id !== null) as string[] }
    }
  });

  console.log(JSON.stringify({
    status: job.status,
    candidatesFoundCount: job.candidatesFound,
    prospectsFoundCount: job.prospectsFound,
    actualCandidatesInDb: candidates.length,
    actualProspectsInDb: prospects.length,
    error: job.errorMessage,
    output: job.agentOutput
  }, null, 2));

  if (candidates.length > 0) {
    console.log('--- SAMPLE CANDIDATES ---');
    candidates.slice(0, 10).forEach(c => {
      console.log(`- ${c.nombreEmpresa} (${c.status}) [Score: ${c.score}]`);
    });
  }

  await prisma.$disconnect();
}

main();
