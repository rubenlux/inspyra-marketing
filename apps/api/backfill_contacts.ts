import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  // Get all prospects that have a website but missing contact fields
  const prospects = await p.prospect.findMany({
    where: { tenantId: '483e19af-46e0-480e-a4ea-5e8513216ef9' },
    select: { id: true, nombreEmpresa: true, email: true, telefono: true, whatsapp: true, instagram: true, facebook: true, linkedin: true }
  });

  console.log(`Found ${prospects.length} prospects to check`);

  let updated = 0;
  for (const prospect of prospects) {
    // Find most recent ResearchCandidate with contactData for this company
    const candidate = await p.researchCandidate.findFirst({
      where: {
        nombreEmpresa: prospect.nombreEmpresa,
        contactData: { not: {} }  // not empty object — has some data
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, contactData: true }
    });

    if (!candidate || !candidate.contactData) continue;

    const cd = candidate.contactData as {
      emails?: string[];
      phones?: string[];
      whatsapp?: string[];
      instagram?: string[];
      facebook?: string[];
      linkedin?: string[];
    };

    const newEmail    = cd.emails?.[0]    ?? null;
    const newPhone    = cd.phones?.[0]    ?? null;
    const newWhatsapp = cd.whatsapp?.[0]  ?? null;
    const newInstagram = cd.instagram?.[0] ?? null;
    const newFacebook  = cd.facebook?.[0]  ?? null;
    const newLinkedin  = cd.linkedin?.[0]  ?? null;

    // Only update fields that are currently null
    const data: Record<string, string | null> = {};
    if (!prospect.email     && newEmail)     data.email     = newEmail;
    if (!prospect.telefono  && newPhone)     data.telefono  = newPhone;
    if (!prospect.whatsapp  && newWhatsapp)  data.whatsapp  = newWhatsapp;
    if (!prospect.instagram && newInstagram) data.instagram = newInstagram;
    if (!prospect.facebook  && newFacebook)  data.facebook  = newFacebook;
    if (!prospect.linkedin  && newLinkedin)  data.linkedin  = newLinkedin;

    if (Object.keys(data).length === 0) continue;

    await p.prospect.update({ where: { id: prospect.id }, data });

    console.log(`✓ ${prospect.nombreEmpresa}: ${Object.entries(data).map(([k,v]) => `${k}=${v}`).join(', ')}`);
    updated++;
  }

  console.log(`\nBackfill complete: ${updated}/${prospects.length} prospects updated`);
}

main().catch(console.error).finally(() => p.$disconnect());
