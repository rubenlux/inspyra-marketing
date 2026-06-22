import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const jobId = '4329f9d8-b10c-450b-83e8-ec01d41fb407';

  const candidates = await prisma.researchCandidate.findMany({
    where: { jobId }
  });

  console.log('--- CANDIDATE AUDIT (Opportunity Engine ERP-052) ---');
  candidates.forEach(c => {
    console.log(`Empresa: ${c.nombreEmpresa}`);
    console.log(`Score: ${c.score ?? 'N/A'}`);
    console.log(`Status: ${c.status}`);
    console.log(`Oportunidad: ${c.oportunidadDetectada ?? 'N/A'}`);
    console.log(`Reasoning: ${c.reasoning ?? 'N/A'}`);
    console.log(`Servicio Sugerido: ${c.servicioSugerido ?? 'N/A'}`);
    console.log('-----------------------------------');
  });

  await prisma.$disconnect();
}

main();
