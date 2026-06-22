import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const jobId = 'e96dd9ae-da55-460a-97f9-2cc72c7f7368';

  const job = await prisma.researchJob.findUnique({
    where: { id: jobId },
    include: {
      candidates: true
    }
  });

  if (!job) {
    console.log('JOB_NOT_FOUND');
    return;
  }

  console.log('JOB_DATA:' + JSON.stringify({
    id: job.id,
    status: job.status,
    sourceType: job.sourceType,
    agentOutput: job.agentOutput,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    candidatesFound: job.candidatesFound,
    prospectsFound: job.prospectsFound,
  }, null, 2));

  const stats = {
    discovered: job.candidates.filter(c => c.status === 'DISCOVERED').length,
    discarded: job.candidates.filter(c => c.status === 'DISCARDED').length,
    promoted: job.candidates.filter(c => c.status === 'PROMOTED').length,
    total: job.candidates.length,
  };

  console.log('CANDIDATE_STATS:' + JSON.stringify(stats, null, 2));
  
  if (job.candidates.length > 0) {
      console.log('FIRST_CANDIDATE_SAMPLE_ID:' + job.candidates[0].id);
      console.log('FIRST_CANDIDATE_SAMPLE:' + JSON.stringify(job.candidates[0], null, 2));
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
