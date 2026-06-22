const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🔧 CORRIGIENDO SCORE EN BD\n');

  const updated = await prisma.prospectValidation.updateMany({
    where: {
      status: 'PENDING',
      reasoning: { contains: 'LOW_OPPORTUNITY' },
    },
    data: {
      agentScore: 65,
    },
  });

  console.log(`✅ ${updated.count} registros corregidos`);
  console.log(`   Score: 35 → 65 (REVISAR)\n`);

  await prisma.$disconnect();
}

main().catch(err => { console.error(err.message); process.exit(1); });
