const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const validation = await prisma.prospectValidation.findFirst({
    where: {
      status: 'DISCARDED',
    },
    include: {
      prospect: {
        select: {
          id: true,
          nombreEmpresa: true,
          score: true,
          estado: true,
          problemasEncontrados: true,
          website: true,
          ciudad: true,
          rubro: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!validation) {
    console.log('No discarded validations found');
    process.exit(0);
  }

  console.log('\n=== DISCARDED PROSPECT ===\n');
  console.log('Prospect:');
  console.log(JSON.stringify(validation.prospect, null, 2));
  console.log('\nValidation:');
  console.log(JSON.stringify({
    id: validation.id,
    agentScore: validation.agentScore,
    status: validation.status,
    discardReason: validation.discardReason,
    servicesRecommended: validation.servicesRecommended,
    reasoning: validation.reasoning?.substring(0, 300),
  }, null, 2));

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
