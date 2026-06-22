import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const jobId = 'd1e8972a-4eb3-4916-a6ba-613576f410d9';

  const job = await prisma.researchJob.findUnique({
    where: { id: jobId }
  });

  if (!job) {
    console.log('JOB_NOT_FOUND');
    return;
  }

  console.log('--- JOB STATUS ---');
  console.log('Status:', job.status);
  console.log('Error:', job.errorMessage);
  console.log('Output:', job.agentOutput);

  await prisma.$disconnect();
}

main();
