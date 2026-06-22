const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const beleni = await prisma.prospectValidation.findFirst({
    where: { prospect: { nombreEmpresa: { contains: 'Beleni' } } },
  });

  console.log('BELENI EN BD:');
  console.log(`  Status: ${beleni.status}`);
  console.log(`  Score: ${beleni.agentScore}`);
  console.log(`  Reasoning: ${beleni.reasoning.substring(0, 100)}...\n`);

  if (beleni.status === 'PENDING' && beleni.agentScore === 35) {
    console.log('⚠️ PROBLEMA: Score 35 se clasifica como DESCARTADO_IA en frontend');
    console.log('   Lógica frontend:');
    console.log('     score < 60 → DESCARTADO_IA\n');
    console.log('SOLUCIÓN: Cambiar score a >= 60 (e.g., 65 para LOW_OPPORTUNITY)');
  }

  await prisma.$disconnect();
}

main().catch(err => { console.error(err.message); process.exit(1); });
