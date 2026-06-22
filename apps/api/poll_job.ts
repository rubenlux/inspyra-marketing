import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const jobId = process.argv[2] || '974d257a-5530-476f-b053-376f04f58a6c';

  const poll = async () => {
    const job = await prisma.researchJob.findUnique({
      where: { id: jobId },
      include: { candidates: true },
    });
    if (!job) { console.log('JOB_NOT_FOUND'); return; }

    const stats = {
      DISCOVERED: job.candidates.filter(c => c.status === 'DISCOVERED').length,
      EVALUATING: job.candidates.filter(c => c.status === 'EVALUATING').length,
      PROMOTED: job.candidates.filter(c => c.status === 'PROMOTED').length,
      DISCARDED: job.candidates.filter(c => c.status === 'DISCARDED').length,
    };

    console.log(`[${new Date().toISOString()}] status=${job.status} | candidates=${job.candidates.length} | ${JSON.stringify(stats)}`);
    console.log(`  output: ${job.agentOutput}`);
    if (job.errorMessage) console.log(`  error: ${job.errorMessage}`);

    if (job.status === 'RUNNING' || job.status === 'PENDING') {
      setTimeout(poll, 4000);
    } else {
      // Print final results
      console.log('\n=== RESULTADO FINAL ===');
      console.log(JSON.stringify({
        status: job.status,
        candidatesFound: job.candidatesFound,
        prospectsFound: job.prospectsFound,
        errorMessage: job.errorMessage,
      }, null, 2));

      console.log('\n=== TABLA E2E: Empresa | Status | Score | Action | Oportunidad ===');
      for (const c of job.candidates.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))) {
        console.log(`${c.nombreEmpresa || 'N/A'} | ${c.status} | ${c.score ?? 'N/A'} | ${c.discardReason ? 'DISCARD' : c.status === 'PROMOTED' ? 'PROMOTE' : 'N/A'} | ${c.oportunidadDetectada || '-'}`);
      }

      console.log('\n=== PROMOTED DETAILS ===');
      for (const c of job.candidates.filter(c => c.status === 'PROMOTED')) {
        console.log(JSON.stringify({
          empresa: c.nombreEmpresa,
          score: c.score,
          servicio: c.servicioSugerido,
          oportunidad: c.oportunidadDetectada,
          problemas: c.problemasDetectados,
          reasoning: c.reasoning,
        }, null, 2));
      }

      console.log('\n=== DISCARD REASONS ===');
      for (const c of job.candidates.filter(c => c.status === 'DISCARDED')) {
        console.log(`${c.nombreEmpresa || 'N/A'}: ${c.discardReason || c.reasoning || 'N/A'}`);
      }

      await prisma.$disconnect();
    }
  };

  poll();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
