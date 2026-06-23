const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function audit() {
  // Get latest enrichment job
  const latestJob = await prisma.enrichmentJob.findFirst({
    where: { status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    include: {
      prospect: true,
      result: true
    }
  });

  if (!latestJob) {
    console.log('❌ No hay jobs completados');
    await prisma.$disconnect();
    return;
  }

  const prospect = latestJob.prospect;
  const result = latestJob.result;

  console.log('\n' + '='.repeat(80));
  console.log('AUDITORÍA DE DATOS REALES - OPPORTUNITY ENGINE');
  console.log('='.repeat(80));

  console.log(`\n📊 PROSPECTO`);
  console.log(`  Nombre: ${prospect.nombreEmpresa}`);
  console.log(`  Rubro: ${prospect.rubro}`);
  console.log(`  Website: ${prospect.website}`);
  console.log(`  Job ID: ${latestJob.id}`);

  console.log(`\n📡 1. SIGNALS CRUDOS RECIBIDOS POR OpportunityEngine.detect()`);
  console.log('─'.repeat(80));
  const signals = typeof result.signals === 'string'
    ? JSON.parse(result.signals)
    : result.signals;

  console.log(JSON.stringify(signals, null, 2));

  console.log(`\n📝 2. NORMALIZED SIGNALS (después de transformación en enrichment.service.ts)`);
  console.log('─'.repeat(80));
  const normalizedSignals = {
    ...signals,
    navContains: signals.mainNavSections ?? [],
    industry: prospect.rubro ?? '',
    tourism: ['Tourism', 'Hotel', 'Bodega', 'Viñedo', 'Restaurante', 'Wine', 'Beverages'].some(ind =>
      (prospect.rubro || '').toLowerCase().includes(ind.toLowerCase())
    ),
  };

  console.log(JSON.stringify(normalizedSignals, null, 2));

  console.log(`\n✅ 3. SERVICIOS ACTIVADOS`);
  console.log('─'.repeat(80));
  const opportunities = typeof result.opportunities === 'string'
    ? JSON.parse(result.opportunities)
    : result.opportunities;

  const activatedOpps = opportunities.filter(o => o.activated);
  console.log(`Total: ${activatedOpps.length} servicios activados\n`);

  for (const opp of activatedOpps) {
    console.log(`\n🟢 ${opp.name} (${opp.serviceId})`);
    console.log(`   Evidence: ${opp.evidence.join(' | ')}`);
  }

  // Load catalog and show rules for activated services
  console.log(`\n\n📋 4. EVALUACIÓN DETALLADA DE REGLAS PARA SERVICIOS ACTIVADOS`);
  console.log('='.repeat(80));

  const catalogPath = path.join(__dirname, 'dist/modules/enrichment/SERVICES_CATALOG_MACHINE.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  for (const activatedOpp of activatedOpps) {
    const service = catalog.services.find(s => s.serviceId === activatedOpp.serviceId);
    if (!service) {
      console.log(`\n⚠️  ${activatedOpp.serviceId} no encontrado en catálogo`);
      continue;
    }

    console.log(`\n\n🔍 ${service.name}`);
    console.log('─'.repeat(80));

    // Required signals
    console.log(`\n  REQUIRED SIGNALS (todos deben matchear):`);
    for (const req of service.requiredSignals) {
      const actual = signals[req.signal];
      const matched = req.operator === 'equals'
        ? actual === req.value
        : actual === undefined ? false : true;

      console.log(`    Signal: ${req.signal}`);
      console.log(`      Esperado: ${JSON.stringify(req.value)} (operator: ${req.operator})`);
      console.log(`      Real: ${JSON.stringify(actual)}`);
      console.log(`      Match: ${matched ? '✅' : '❌'}`);
    }

    // Optional groups
    console.log(`\n  OPTIONAL GROUPS (${service.minOptionalMatches} de ${Object.keys(service.optionalGroups || {}).length} deben matchear):`);
    let matchedGroupCount = 0;
    const optionalArray = Object.values(service.optionalGroups || {});
    for (let i = 0; i < optionalArray.length; i++) {
      const group = optionalArray[i];
      let groupMatched = true;

      console.log(`\n    Grupo ${i}:`);
      for (const sig of group) {
        const actual = signals[sig.signal];
        let sigMatched = false;

        if (sig.operator === 'equals') {
          sigMatched = actual === sig.value;
        } else if (sig.operator === 'in') {
          sigMatched = Array.isArray(sig.value) && sig.value.includes(actual);
        } else if (sig.operator === 'includes_any') {
          if (Array.isArray(actual) && Array.isArray(sig.value)) {
            sigMatched = actual.some(a => sig.value.includes(a));
          }
        }

        if (!sigMatched) groupMatched = false;

        console.log(`      Signal: ${sig.signal}`);
        console.log(`        Esperado: ${JSON.stringify(sig.value)} (operator: ${sig.operator})`);
        console.log(`        Real: ${JSON.stringify(actual)}`);
        console.log(`        Match: ${sigMatched ? '✅' : '❌'}`);
      }

      if (groupMatched) matchedGroupCount++;
      console.log(`    Grupo completo: ${groupMatched ? '✅' : '❌'}`);
    }
    console.log(`\n  Grupos matched: ${matchedGroupCount}/${service.minOptionalMatches} ✅`);

    // Forbidden signals
    console.log(`\n  FORBIDDEN SIGNALS (ninguno debe matchear):`);
    for (const forb of service.forbiddenSignals) {
      const actual = signals[forb.signal];
      const matched = forb.operator === 'equals'
        ? actual === forb.value
        : false;

      console.log(`    Signal: ${forb.signal}`);
      console.log(`      Esperado: NO ${JSON.stringify(forb.value)}`);
      console.log(`      Real: ${JSON.stringify(actual)}`);
      console.log(`      Match: ${matched ? '❌ BLOQUEADO' : '✅ OK (no bloqueado)'}`);
    }
  }

  await prisma.$disconnect();
}

audit();
