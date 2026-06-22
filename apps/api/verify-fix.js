const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 VERIFICACIÓN DEL FIX\n');
  
  // Get the most recently created prospect (should have the fix)
  const newest = await prisma.prospect.findFirst({
    where: {
      fuente: 'GOOGLE_MAPS',
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      nombreEmpresa: true,
      createdAt: true,
      problemasEncontrados: true,
      currentProblems: true,
      website: true,
      instagram: true,
      linkedin: true,
    },
  });

  if (!newest) {
    console.log('No Google Maps prospects found');
    process.exit(0);
  }

  console.log('📊 PROSPECTO MÁS RECIENTE (debería tener el fix):');
  console.log(`   ID: ${newest.id}`);
  console.log(`   Nombre: ${newest.nombreEmpresa}`);
  console.log(`   Creado: ${newest.createdAt.toISOString()}`);
  console.log(`   Tiene website: ${newest.website ? '✅' : '❌'}`);
  console.log(`   Tiene instagram: ${newest.instagram ? '✅' : '❌'}`);
  console.log(`   Tiene linkedin: ${newest.linkedin ? '✅' : '❌'}`);
  
  console.log(`\n   problemasEncontrados: ${newest.problemasEncontrados?.length === 0 ? '❌ VACÍO' : '✅ POBLADO'}`);
  if (newest.problemasEncontrados?.length) {
    console.log(`   Contenido: [${newest.problemasEncontrados.join(', ')}]`);
  }
  
  console.log(`\n   currentProblems: ${newest.currentProblems?.length === 0 ? '(vacío)' : newest.currentProblems}`);

  // Get count of recent prospects with and without problems
  const [withProblems, withoutProblems] = await Promise.all([
    prisma.prospect.count({
      where: {
        fuente: 'GOOGLE_MAPS',
        deletedAt: null,
        problemasEncontrados: { not: { equals: [] } },
      },
    }),
    prisma.prospect.count({
      where: {
        fuente: 'GOOGLE_MAPS',
        deletedAt: null,
        problemasEncontrados: { equals: [] },
      },
    }),
  ]);

  console.log(`\n📈 ESTADÍSTICAS:`);
  console.log(`   Con problemas detectados: ${withProblems}`);
  console.log(`   Sin problemas (vacío): ${withoutProblems}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
