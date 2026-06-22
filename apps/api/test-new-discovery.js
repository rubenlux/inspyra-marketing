const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🧪 TEST: Crear un prospecto de prueba con deriveMapsProblems()\n');

  // Import the function
  const { deriveMapsProblems } = require('./dist/modules/research/domain/derive-maps-problems');

  // Simulate a company from Google Maps
  const testCompany = {
    nombreEmpresa: 'TEST_Inmobiliaria_' + Date.now(),
    website: 'https://example.com',
    rating: 3.5,  // Baja calificación
    reviewCount: 15,  // Pocas reseñas
    instagram: null,
    linkedin: null,
    source: 'google_maps',
  };

  console.log('📍 Empresa de prueba:');
  console.log(`   nombre: ${testCompany.nombreEmpresa}`);
  console.log(`   website: ${testCompany.website}`);
  console.log(`   rating: ${testCompany.rating}`);
  console.log(`   reviewCount: ${testCompany.reviewCount}`);
  console.log(`   instagram: ${testCompany.instagram}`);
  console.log(`   linkedin: ${testCompany.linkedin}`);

  const problems = deriveMapsProblems(testCompany);

  console.log(`\n✨ Problemas detectados por deriveMapsProblems():`);
  if (problems.length === 0) {
    console.log('   ❌ VACÍO (FIX NO FUNCIONA)');
  } else {
    problems.forEach(p => console.log(`   ✅ ${p}`));
  }

  console.log('\n');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
