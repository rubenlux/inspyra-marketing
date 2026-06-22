const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🔬 AUDITORÍA FORENSE: ¿Dónde están los 20 prospectos descartados?\n');

  // Get DISCARDED validations from the last few hours
  const discarded = await prisma.prospectValidation.findMany({
    where: {
      status: 'DISCARDED',
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
    include: {
      prospect: {
        select: {
          id: true,
          nombreEmpresa: true,
          fuente: true,
          problemasEncontrados: true,
          website: true,
          email: true,
          telefono: true,
          deletedAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 25,
  });

  console.log(`📊 Total de validaciones DISCARDED (últimas 24hs): ${discarded.length}\n`);

  if (discarded.length === 0) {
    console.log('No DISCARDED validations found in last 24 hours');
    process.exit(0);
  }

  console.log('═══════════════════════════════════════════════════════════\n');

  discarded.slice(0, 5).forEach((v, i) => {
    console.log(`[${i + 1}] ${v.prospect.nombreEmpresa}`);
    console.log(`    prospectId: ${v.prospect.id}`);
    console.log(`    Validación: ${v.id}`);
    console.log(`    Creada: ${v.createdAt.toISOString()}`);
    console.log(`    Razón: ${v.discardReason}`);
    console.log(`    Problemas encontrados: ${v.prospect.problemasEncontrados?.length || 0}`);
    console.log(`    Website: ${v.prospect.website ? '✅' : '❌'}`);
    console.log(`    Email: ${v.prospect.email ? '✅' : '❌'}`);
    console.log(`    Prospect deleted: ${v.prospect.deletedAt ? 'SÍ' : 'NO'}`);
    console.log(`    Fuente: ${v.prospect.fuente}`);
    console.log('');
  });

  // Summary
  const byReason = {};
  discarded.forEach(v => {
    byReason[v.discardReason] = (byReason[v.discardReason] || 0) + 1;
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📈 RAZONES DE DESCARTE:\n');
  Object.entries(byReason).forEach(([reason, count]) => {
    console.log(`   ${reason}: ${count}`);
  });

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
