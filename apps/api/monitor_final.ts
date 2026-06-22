import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const jobId = 'd55cf969-eaa5-4b79-85cd-7c06040eaf26';

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

  const promoted = candidates.filter(c => c.status === 'PROMOTED');

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
    candidatesPromoted: promoted.length,
    actualProspectsInDb: prospects.length,
    error: job.errorMessage,
    output: job.agentOutput
  }, null, 2));

  await prisma.$disconnect();
}

main();
