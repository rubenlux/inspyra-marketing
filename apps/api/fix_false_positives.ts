import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  // La vinícola: rsrc.php is Facebook CDN, not a real Instagram account
  const r1 = await p.prospect.updateMany({
    where: { nombreEmpresa: 'La vinícola', instagram: 'https://instagram.com/rsrc.php' },
    data: { instagram: null }
  });

  // Bodega Vistalba: example@domain.com is a placeholder, not real
  const r2 = await p.prospect.updateMany({
    where: { nombreEmpresa: 'Bodega Vistalba', email: 'example@domain.com' },
    data: { email: null }
  });

  // Also clean from ResearchCandidate contactData to avoid re-backfill
  const candidates = await p.researchCandidate.findMany({
    where: { nombreEmpresa: { in: ['La vinícola', 'Bodega Vistalba'] } },
    select: { id: true, nombreEmpresa: true, contactData: true }
  });

  for (const c of candidates) {
    if (!c.contactData) continue;
    const cd = c.contactData as Record<string, string[]>;
    let changed = false;

    if (c.nombreEmpresa === 'La vinícola' && cd.instagram) {
      cd.instagram = cd.instagram.filter((u: string) => !u.includes('rsrc.php'));
      changed = true;
    }
    if (c.nombreEmpresa === 'Bodega Vistalba' && cd.emails) {
      cd.emails = cd.emails.filter((e: string) => e !== 'example@domain.com');
      changed = true;
    }

    if (changed) {
      await p.researchCandidate.update({ where: { id: c.id }, data: { contactData: cd } });
    }
  }

  console.log(`La vinícola instagram reset: ${r1.count} rows`);
  console.log(`Bodega Vistalba email reset: ${r2.count} rows`);
  console.log('False positives cleaned.');
}

main().catch(console.error).finally(() => p.$disconnect());
