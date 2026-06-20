/**
 * ERP-052 — Marcar prospectos históricos como isLegacy = true
 * Criterio: createdAt < 2026-06-17 (antes de los fixes de Discovery/Research)
 * NO elimina físicamente. Solo excluye del motor comercial.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CUTOFF = new Date('2026-06-17T00:00:00-03:00');

async function main() {
  const tenantId = '483e19af-46e0-480e-a4ea-5e8513216ef9';

  // Preview: qué se va a marcar
  const targets = await prisma.prospect.findMany({
    where: { tenantId, deletedAt: null, createdAt: { lt: CUTOFF }, isLegacy: false },
    select: { id: true, nombreEmpresa: true, estado: true, createdAt: true, problemasEncontrados: true },
    orderBy: { createdAt: 'asc' },
  });

  if (targets.length === 0) {
    console.log('No hay prospectos legacy pendientes de marcar.');
    return;
  }

  console.log(`\nProspectos a marcar como isLegacy = true (${targets.length}):\n`);
  for (const p of targets) {
    const d = p.createdAt.toISOString().slice(0, 10);
    const probs = p.problemasEncontrados?.length ?? 0;
    console.log(`  ${d}  [${p.estado.padEnd(12)}]  ${(p.nombreEmpresa ?? '?').padEnd(40)}  (${probs} problemas)`);
  }

  console.log(`\nCutoff: ${CUTOFF.toISOString().slice(0, 10)}`);
  console.log(`Total a marcar: ${targets.length}`);

  // Ejecutar update
  const result = await prisma.prospect.updateMany({
    where: { tenantId, deletedAt: null, createdAt: { lt: CUTOFF } },
    data: { isLegacy: true },
  });

  console.log(`\n✓ ${result.count} prospectos marcados como isLegacy = true.`);

  // Verificación final
  const legacyCount = await prisma.prospect.count({ where: { tenantId, isLegacy: true } });
  const activeCount = await prisma.prospect.count({ where: { tenantId, isLegacy: false, deletedAt: null } });
  console.log(`\nEstado final:`);
  console.log(`  isLegacy = true:  ${legacyCount}`);
  console.log(`  isLegacy = false: ${activeCount} (dataset limpio)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
