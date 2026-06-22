const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🔬 AUDITORÍA FORENSE: BELENI PROPIEDADES\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Find Beleni
  const prospect = await prisma.prospect.findFirst({
    where: {
      nombreEmpresa: {
        contains: 'Beleni',
        mode: 'insensitive',
      },
    },
  });

  if (!prospect) {
    console.log('❌ Beleni Propiedades not found');
    process.exit(1);
  }

  console.log('📍 PROSPECTO EN BD:\n');
  console.log(JSON.stringify(prospect, null, 2));

  console.log('\n═══════════════════════════════════════════════════════════\n');
  console.log('🔍 ANÁLISIS DE CAMPOS CRÍTICOS:\n');

  console.log('CONTACTABILIDAD:');
  console.log(`  email: ${prospect.email ? '✅ ' + prospect.email : '❌ null'}`);
  console.log(`  telefono: ${prospect.telefono ? '✅ ' + prospect.telefono : '❌ null'}`);
  console.log(`  whatsapp: ${prospect.whatsapp ? '✅ ' + prospect.whatsapp : '❌ null'}`);
  console.log(`  instagram: ${prospect.instagram ? '✅ ' + prospect.instagram : '❌ null'}`);
  console.log(`  facebook: ${prospect.facebook ? '✅ ' + prospect.facebook : '❌ null'}`);
  console.log(`  linkedin: ${prospect.linkedin ? '✅ ' + prospect.linkedin : '❌ null'}`);
  console.log(`  website: ${prospect.website ? '✅ ' + prospect.website : '❌ null'}`);

  console.log('\nPROBLEMAS DETECTADOS:');
  console.log(`  problemasEncontrados: ${JSON.stringify(prospect.problemasEncontrados)}`);
  console.log(`  currentProblems: ${JSON.stringify(prospect.currentProblems)}`);

  console.log('\nDATA FIELDS (JSON):');
  console.log(`  contactData: ${prospect.contactData ? '✅ exists' : '❌ null'}`);
  if (prospect.contactData) {
    console.log(`    ${JSON.stringify(prospect.contactData).substring(0, 200)}...`);
  }

  console.log(`  qualificationSignals: ${prospect.qualificationSignals ? '✅ exists' : '❌ null'}`);
  if (prospect.qualificationSignals) {
    console.log(`    ${JSON.stringify(prospect.qualificationSignals).substring(0, 200)}...`);
  }

  console.log(`  enrichmentResult: ${prospect.enrichmentResult ? '✅ exists' : '❌ null'}`);
  if (prospect.enrichmentResult) {
    console.log(`    ${JSON.stringify(prospect.enrichmentResult).substring(0, 200)}...`);
  }

  // Get validation
  console.log('\n═══════════════════════════════════════════════════════════\n');
  console.log('🤖 VALIDACIÓN DEL OPPORTUNITY AGENT:\n');

  const validation = await prisma.prospectValidation.findUnique({
    where: { prospectId: prospect.id },
  });

  if (!validation) {
    console.log('❌ No validation record found');
  } else {
    console.log(`Status: ${validation.status}`);
    console.log(`Discard Reason: ${validation.discardReason}`);
    console.log(`Agent Score: ${validation.agentScore}`);
    console.log(`Services Recommended: ${JSON.stringify(validation.servicesRecommended)}`);
    console.log(`\nReasoning:\n${validation.reasoning}`);
    console.log(`\nDecision Factors:\n${JSON.stringify(validation.decisionFactors, null, 2)}`);
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
