const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  // Get Beleni with enrichmentResult
  const prospect = await prisma.prospect.findFirst({
    where: { nombreEmpresa: { contains: 'Beleni' } },
    include: { enrichmentResult: true }
  });

  if (!prospect || !prospect.enrichmentResult) {
    console.log('❌ No encontrado');
    await prisma.$disconnect();
    return;
  }

  const result = prospect.enrichmentResult;

  console.log('\n📊 QUÉ DEVUELVE EL ENDPOINT GET');
  console.log(`\nProspect ID: ${prospect.id}`);
  console.log(`\nEnrichmentResult objeto completo:`);
  console.log(JSON.stringify(result, null, 2));

  console.log('\n\n🔍 PARSED opportunities:');
  try {
    const opps = typeof result.opportunities === 'string'
      ? JSON.parse(result.opportunities)
      : result.opportunities;
    console.log(JSON.stringify(opps, null, 2));
  } catch (e) {
    console.log(`❌ Error parsing: ${e.message}`);
    console.log(`Raw value: ${result.opportunities}`);
  }

  await prisma.$disconnect();
}

test();
