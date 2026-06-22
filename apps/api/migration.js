const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🔄 MIGRANDO VALIDACIONES DESCARTADAS\n');

  const toMigrate = await prisma.prospectValidation.findMany({
    where: { status: 'DISCARDED', discardReason: 'INSUFFICIENT_DATA' },
    include: { prospect: { select: { email: true, telefono: true, website: true, instagram: true, facebook: true, linkedin: true, whatsapp: true, nombreEmpresa: true } } },
  });

  const candidates = toMigrate.filter(v => v.prospect.email || v.prospect.telefono || v.prospect.website || v.prospect.instagram || v.prospect.facebook || v.prospect.linkedin || v.prospect.whatsapp);

  console.log(`Candidatos a migrar: ${candidates.length}`);
  console.log(`(Tienen datos de contacto pero fueron descartados)\n`);

  const updated = await prisma.$transaction(
    candidates.map(v => 
      prisma.prospectValidation.update({
        where: { id: v.id },
        data: { 
          status: 'PENDING', 
          agentScore: 35, 
          discardReason: null, 
          reasoning: 'LOW_OPPORTUNITY — Datos verificados, sin brechas específicas. Requiere análisis comercial.',
        },
      })
    )
  );

  console.log(`✅ ${updated.length} registros migrados\n`);

  const beleni = await prisma.prospectValidation.findFirst({
    where: { prospect: { nombreEmpresa: { contains: 'Beleni' } } },
  });

  console.log('BELENI PROPIEDADES (DESPUÉS DE MIGRACIÓN):');
  console.log(`  Status: ${beleni.status} (era: DISCARDED)`);
  console.log(`  Score: ${beleni.agentScore} (era: 0)`);
  console.log(`  Discard Reason: ${beleni.discardReason} (era: INSUFFICIENT_DATA)`);
  console.log(`  ✅ Ahora visible en PENDIENTE_OPP\n`);

  await prisma.$disconnect();
}

main().catch(err => { console.error(err.message); process.exit(1); });
