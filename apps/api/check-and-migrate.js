const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 VERIFICACIÓN PRE-MIGRACIÓN\n');

  // Check current state of Beleni
  const beleni = await prisma.prospect.findFirst({
    where: { nombreEmpresa: { contains: 'Beleni', mode: 'insensitive' } },
    include: { validation: { select: { id: true, status: true, discardReason: true, agentScore: true } } },
  });

  if (beleni && beleni.validation) {
    console.log('BELENI PROPIEDADES (ESTADO ACTUAL):');
    console.log(`  Validation ID: ${beleni.validation.id}`);
    console.log(`  Status: ${beleni.validation.status}`);
    console.log(`  Discard Reason: ${beleni.validation.discardReason}`);
    console.log(`  Agent Score: ${beleni.validation.agentScore}`);
    console.log(`\n  Tiene datos de contacto:`);
    console.log(`    Email: ${beleni.email ? '✅' : '❌'}`);
    console.log(`    Telefono: ${beleni.telefono ? '✅' : '❌'}`);
    console.log(`    Website: ${beleni.website ? '✅' : '❌'}`);
    console.log(`    Instagram: ${beleni.instagram ? '✅' : '❌'}`);
    console.log(`\n  → Debería ser reclasificado: SÍ\n`);
  }

  // Count candidates for reclassification
  console.log('📊 ESTADÍSTICAS DE RECLASIFICACIÓN:\n');

  const toReclassify = await prisma.prospectValidation.findMany({
    where: {
      status: 'DISCARDED',
      discardReason: 'INSUFFICIENT_DATA',
    },
    include: {
      prospect: {
        select: {
          email: true,
          telefono: true,
          website: true,
          instagram: true,
          facebook: true,
          linkedin: true,
          whatsapp: true,
        },
      },
    },
  });

  console.log(`Total DISCARDED con INSUFFICIENT_DATA: ${toReclassify.length}`);

  const hasContactData = toReclassify.filter(v => 
    v.prospect.email || v.prospect.telefono || v.prospect.website ||
    v.prospect.instagram || v.prospect.facebook || v.prospect.linkedin ||
    v.prospect.whatsapp
  );

  console.log(`Con datos de contacto (candidatos): ${hasContactData.length}`);
  console.log(`Sin datos de contacto (legítimo discard): ${toReclassify.length - hasContactData.length}\n`);

  console.log('⚠️ MIGRACIÓN NECESARIA:');
  console.log(`Reclasificar ${hasContactData.length} validaciones`);
  console.log(`De: DISCARDED (INSUFFICIENT_DATA, score 0)`);
  console.log(`A: PENDING (LOW_OPPORTUNITY, score 35)\n`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
