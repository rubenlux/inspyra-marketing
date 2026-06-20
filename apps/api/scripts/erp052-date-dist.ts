import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const tenantId = '483e19af-46e0-480e-a4ea-5e8513216ef9';
  const rows = await prisma.$queryRaw<{ day: Date; total: bigint; with_problems: bigint }[]>`
    SELECT DATE("createdAt") as day,
           COUNT(*) as total,
           COUNT(CASE WHEN array_length("problemasEncontrados", 1) > 0 THEN 1 END) as with_problems
    FROM prospects
    WHERE "tenantId" = ${tenantId}
      AND "deletedAt" IS NULL
    GROUP BY DATE("createdAt")
    ORDER BY day
  `;
  console.log('\nDistribución de prospectos por fecha de creación:\n');
  console.log('Fecha       | Total | Con problemas');
  console.log('────────────|───────|──────────────');
  for (const r of rows) {
    const d = new Date(r.day).toISOString().slice(0, 10);
    console.log(`${d} |  ${String(Number(r.total)).padStart(3)}  | ${Number(r.with_problems)}`);
  }
  const oldest = rows[0]?.day ? new Date(rows[0].day).toISOString().slice(0, 10) : '?';
  const newest = rows[rows.length - 1]?.day ? new Date(rows[rows.length - 1].day).toISOString().slice(0, 10) : '?';
  console.log(`\nRango: ${oldest} → ${newest}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
