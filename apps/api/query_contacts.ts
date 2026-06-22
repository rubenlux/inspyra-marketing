import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const names = ['Bodegas López', 'Casa Vigil Bodega', 'Bodega Budeguer', 'Bodega La Azul'];

async function main() {
  const prospects = await p.prospect.findMany({
    where: { nombreEmpresa: { in: names } },
    select: { id: true, nombreEmpresa: true, website: true, email: true, telefono: true, whatsapp: true, instagram: true, facebook: true, linkedin: true }
  });
  console.log('=== PROSPECTS ===');
  console.log(JSON.stringify(prospects, null, 2));

  const candidates = await p.researchCandidate.findMany({
    where: { nombreEmpresa: { in: names } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, nombreEmpresa: true, status: true, prospectId: true, contactData: true, createdAt: true }
  });
  console.log('=== RESEARCH CANDIDATES ===');
  console.log(JSON.stringify(candidates, null, 2));
}

main().catch(console.error).finally(() => p.$disconnect());
