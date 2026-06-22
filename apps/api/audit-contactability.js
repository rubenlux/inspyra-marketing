const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find a prospect that was created from a ResearchCandidate
  const prospect = await prisma.prospect.findFirst({
    where: {
      fuente: 'GOOGLE_MAPS',
      deletedAt: null,
    },
    include: {
      validation: {
        select: {
          id: true,
          agentScore: true,
          status: true,
          discardReason: true,
          decisionFactors: true,
          reasoning: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });

  if (!prospect) {
    console.log('No Google Maps prospect found');
    process.exit(0);
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║            CONTACTABILITY AUDIT TRAIL                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('📍 PROSPECT:');
  console.log(`   ID: ${prospect.id}`);
  console.log(`   Nombre: ${prospect.nombreEmpresa}`);
  console.log(`   Fuente: ${prospect.fuente}`);
  console.log(`   Estado: ${prospect.estado}\n`);

  console.log('📋 PROSPECT CONTACT FIELDS:');
  console.log(`   email: ${prospect.email ? '✅ ' + prospect.email : '❌ null'}`);
  console.log(`   telefono: ${prospect.telefono ? '✅ ' + prospect.telefono : '❌ null'}`);
  console.log(`   whatsapp: ${prospect.whatsapp ? '✅ ' + prospect.whatsapp : '❌ null'}`);
  console.log(`   instagram: ${prospect.instagram ? '✅ ' + prospect.instagram : '❌ null'}`);
  console.log(`   facebook: ${prospect.facebook ? '✅ ' + prospect.facebook : '❌ null'}`);
  console.log(`   linkedin: ${prospect.linkedin ? '✅ ' + prospect.linkedin : '❌ null'}\n`);

  if (prospect.validation) {
    console.log('🤖 OPPORTUNITY AGENT VALIDATION:');
    console.log(`   Status: ${prospect.validation.status}`);
    console.log(`   Discard Reason: ${prospect.validation.discardReason || 'N/A'}`);
    console.log(`   Agent Score: ${prospect.validation.agentScore}`);
    
    if (prospect.validation.decisionFactors) {
      const df = prospect.validation.decisionFactors;
      console.log('\n   Decision Factors:');
      console.log(`   - matchFitScore: ${df.matchFitScore}`);
      console.log(`   - impactScore: ${df.impactScore}`);
      console.log(`   - contactScore: ${df.contactScore}`);
    }
    
    if (prospect.validation.reasoning) {
      console.log('\n   Reasoning (first 300 chars):');
      console.log(`   ${prospect.validation.reasoning.substring(0, 300)}...`);
    }
  } else {
    console.log('🤖 OPPORTUNITY AGENT VALIDATION: ❌ NOT RUN YET');
  }

  // Now look for the original ResearchCandidate if it exists
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         SEARCHING FOR ORIGINAL RESEARCH CANDIDATE          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Try to find by nombre + ciudad
  const candidates = await prisma.researchCandidate.findMany({
    where: {
      nombreEmpresa: prospect.nombreEmpresa,
      ciudad: prospect.ciudad,
    },
    take: 5,
  });

  if (candidates.length === 0) {
    console.log('❌ No ResearchCandidate found with same nombre + ciudad');
    console.log('   (Candidate may have been deleted or names may not match exactly)\n');
  } else {
    const candidate = candidates[0];
    console.log(`✅ Found ${candidates.length} matching candidate(s). Showing first:\n`);
    
    console.log('📋 RESEARCH CANDIDATE ORIGINAL CONTACT DATA:');
    console.log(`   ID: ${candidate.id}`);
    console.log(`   Nombre: ${candidate.nombreEmpresa}`);
    console.log(`   Email: ${candidate.email ? '✅ ' + candidate.email : '❌ null'}`);
    console.log(`   Telefono: ${candidate.telefono ? '✅ ' + candidate.telefono : '❌ null'}\n`);

    if (candidate.contactData && typeof candidate.contactData === 'object') {
      console.log('📦 CONTACT DATA (JSON field):');
      const cd = candidate.contactData;
      console.log(`   emails: ${cd.emails?.length ? '✅ ' + cd.emails.join(', ') : '❌ []'}`);
      console.log(`   phones: ${cd.phones?.length ? '✅ ' + cd.phones.join(', ') : '❌ []'}`);
      console.log(`   whatsapp: ${cd.whatsapp?.length ? '✅ ' + cd.whatsapp.join(', ') : '❌ []'}`);
      console.log(`   instagram: ${cd.instagram?.length ? '✅ ' + cd.instagram.join(', ') : '❌ []'}`);
      console.log(`   facebook: ${cd.facebook?.length ? '✅ ' + cd.facebook.join(', ') : '❌ []'}`);
      console.log(`   linkedin: ${cd.linkedin?.length ? '✅ ' + cd.linkedin.join(', ') : '❌ []'}\n`);
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║            TRANSFORMATION ANALYSIS                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('CANDIDATE → PROSPECT MAPPING:\n');
    
    const mapping = [
      { field: 'email', source: candidate.email, dest: prospect.email },
      { field: 'telefono', source: candidate.telefono, dest: prospect.telefono },
      { field: 'instagram', source: candidate.instagram, dest: prospect.instagram },
      { field: 'facebook', source: candidate.facebook, dest: prospect.facebook },
      { field: 'linkedin', source: candidate.linkedin, dest: prospect.linkedin },
    ];

    mapping.forEach(m => {
      const status = m.source === m.dest ? '✅' : (m.source && !m.dest ? '❌ LOST' : '⚠️');
      console.log(`${status} ${m.field.padEnd(12)} : "${m.source ?? 'null'}" → "${m.dest ?? 'null'}"`);
    });

    // Also check contactData if it has it
    if (candidate.contactData && typeof candidate.contactData === 'object') {
      console.log('\nCONTACT DATA EXTRACTION:\n');
      const cd = candidate.contactData;
      const firstEmail = cd.emails?.[0];
      const firstPhone = cd.phones?.[0];
      
      console.log(`emails[0] → prospect.email    : "${firstEmail ?? 'N/A'}" vs "${prospect.email ?? 'null'}"`);
      console.log(`phones[0] → prospect.telefono : "${firstPhone ?? 'N/A'}" vs "${prospect.telefono ?? 'null'}"`);
    }
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
