// One-shot backfill: calculate Business Value Score for existing prospects
// that were created before ERP-049 and have commercialScore = NULL.
// Uses research_candidates.prospectId to join back to source data.

const { Client } = require('pg');

const BVS_MAX = 20;

function calculateBVS(facturacion, empleados, anosFundacion, rubro, ticketUsd) {
  // A. Ticket Potential (0-6)
  let ticket = 0;
  const t = ticketUsd ?? 0;
  if (t >= 3000) ticket = 6;
  else if (t >= 2500) ticket = 5;
  else if (t >= 2000) ticket = 4;
  else if (t >= 1500) ticket = 2;
  else if (t >= 1000) ticket = 1;

  // B. Company Scale (0-8) = billing (0-4) + employees (0-4)
  let billing = 0;
  const fac = (facturacion ?? '').toLowerCase();
  if (fac === 'grande') billing = 4;
  else if (fac === 'mediana') billing = 3;
  else if (fac === 'pequeña' || fac === 'pequena') billing = 1;

  const emp = empleados ?? 0;
  let employees = 0;
  if (emp >= 10) employees = 4;
  else if (emp >= 7) employees = 3;
  else if (emp >= 5) employees = 2;
  else if (emp >= 3) employees = 1;

  // C. Maturity (0-4)
  let maturity = 0;
  const foundedYear = parseInt(anosFundacion ?? '0', 10);
  if (foundedYear > 1900) {
    const yearsOld = new Date().getFullYear() - foundedYear;
    if (yearsOld >= 30) maturity = 4;
    else if (yearsOld >= 20) maturity = 3;
    else if (yearsOld >= 10) maturity = 2;
    else if (yearsOld >= 5) maturity = 1;
  }

  // D. Sub-sector Premium (0-2)
  const r = (rubro ?? '').toLowerCase();
  let premium = 0;
  if (/lujo|premium|corporativo|internacional/.test(r)) premium = 2;
  else if (/multiservicio|comercial|empresarial/.test(r)) premium = 1;

  return Math.min(BVS_MAX, ticket + billing + employees + maturity + premium);
}

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    database: 'inspyra_erp',
    user: 'inspyra',
    password: 'inspyra_dev_secret',
  });

  await client.connect();
  console.log('Connected to inspyra_erp');

  // Find all prospects missing commercialScore with their research_candidate data
  const { rows } = await client.query(`
    SELECT
      p.id AS prospect_id,
      p.score,
      p."empleadosEstimado" AS empleados,
      p.rubro,
      rc."facturacionEstimada" AS facturacion,
      rc."anosFundacion",
      rc."estimatedTicketUsd" AS ticket
    FROM prospects p
    LEFT JOIN research_candidates rc ON rc."prospectId" = p.id
    WHERE p."commercialScore" IS NULL
      AND p."deletedAt" IS NULL
    ORDER BY p."createdAt"
  `);

  console.log(`Found ${rows.length} prospects to backfill`);

  let updated = 0;
  for (const row of rows) {
    const bvs = calculateBVS(row.facturacion, row.empleados, row.anosfundacion, row.rubro, row.ticket);
    await client.query(
      `UPDATE prospects SET "commercialScore" = $1 WHERE id = $2`,
      [bvs, row.prospect_id],
    );
    console.log(`  ${row.prospect_id.slice(0, 8)}… | Pain=${row.score} | BVS=${bvs} | Priority=${Math.min(100, Math.round(row.score * 0.7) + bvs)}`);
    updated++;
  }

  console.log(`\nBackfill complete: ${updated} prospects updated.`);
  await client.end();
}

main().catch(err => { console.error(err); process.exit(1); });
