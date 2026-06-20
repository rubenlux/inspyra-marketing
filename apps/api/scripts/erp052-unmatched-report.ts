/**
 * ERP-052 — Reporte de problemas sin match
 * Lista todos los problemas detectados por los agentes que no matchean
 * con ningún servicio INSPYRA, agrupados por frecuencia.
 * No escribe nada en la DB.
 */
import { PrismaClient } from '@prisma/client';
import {
  INSPYRA_SERVICE_IDS,
  findAllServiceMatches,
} from '../src/modules/service-intelligence/catalog';

const prisma = new PrismaClient();

async function main() {
  const firstTenant = await prisma.tenant.findFirst({ select: { id: true, name: true } });
  if (!firstTenant) { console.error('No tenants found'); return; }

  const tenantId = firstTenant.id;

  const prospects = await prisma.prospect.findMany({
    where: { tenantId, deletedAt: null, isLegacy: false },
    select: { nombreEmpresa: true, rubro: true, problemasEncontrados: true },
  });

  // Contar frecuencia de cada problema sin match
  const unmatchedFreq = new Map<string, number>();
  const matchedProblems = new Set<string>();
  let totalProblems = 0;
  let totalMatched = 0;

  for (const p of prospects) {
    const problems: string[] = p.problemasEncontrados ?? [];
    for (const prob of problems) {
      totalProblems++;
      const matches = findAllServiceMatches([prob], INSPYRA_SERVICE_IDS);
      if (matches.length > 0) {
        totalMatched++;
        matchedProblems.add(prob);
      } else {
        unmatchedFreq.set(prob, (unmatchedFreq.get(prob) ?? 0) + 1);
      }
    }
  }

  // Ordenar por frecuencia desc
  const sorted = [...unmatchedFreq.entries()].sort((a, b) => b[1] - a[1]);
  const top50 = sorted.slice(0, 50);

  console.log('\n' + '═'.repeat(100));
  console.log('ERP-052 — Problemas SIN match · Top 50 por frecuencia');
  console.log(`Prospectos: ${prospects.length} · Problemas totales: ${totalProblems} · Con match: ${totalMatched} · Sin match: ${unmatchedFreq.size} únicos`);
  console.log('═'.repeat(100));
  console.log('\nClasificación sugerida:');
  console.log('  [A] Debería matchear con un servicio INSPYRA — falta patrón o patrón muy estricto');
  console.log('  [B] No debería matchear — INSPYRA no vende esto');
  console.log('  [C] Nueva oportunidad — INSPYRA podría venderlo pero no tiene regla todavía');
  console.log('  [?] Sin clasificar\n');

  // Clasificación automática por palabras clave
  function classify(prob: string): string {
    const p = prob.toLowerCase();

    // Grupo A: debería matchear (GBP, SEO, web, ecommerce, redes, seguridad, hosting)
    if (/google.?business|gbp|ficha.?(google|maps)|perfil.?(google|maps)|maps/.test(p)) return 'A';
    if (/presencia.?digital|presencia.?online|presencia.?web/.test(p)) return 'A';
    if (/sin.?web|sin.?sitio|sin.?página|no.?tiene.?web|sin.?online/.test(p)) return 'A';
    if (/ecommerce|tienda.?online|venta.?online|canal.?digital/.test(p)) return 'A';
    if (/seo|posicionamiento|búsqueda|ranking|orgán/.test(p)) return 'A';
    if (/redes.?sociales|instagram|facebook|social/.test(p) && !/linkedin/.test(p)) return 'A';
    if (/velocidad|performance|lento|carga|web.?vital/.test(p)) return 'A';
    if (/seguridad|vulnerab|malware|hacke|ssl|https|backup/.test(p)) return 'A';

    // Grupo B: no vendemos esto (LinkedIn, dependencias comerciales, logística, RRHH, CRM)
    if (/linkedin/.test(p)) return 'B';
    if (/whatsapp|telegram|crm|erp|facturac/.test(p)) return 'B';
    if (/referidos|boca.?en.?boca|orgánico.?puro/.test(p)) return 'B';
    if (/rrhh|emplead|contrat|proveedor|logística/.test(p)) return 'B';
    if (/agenda.?online|reservas|turnos|booking/.test(p)) return 'B';

    // Grupo C: oportunidades reales sin regla
    if (/cta|call.?to.?action|botón|formulario|captura|lead|conversión/.test(p)) return 'C';
    if (/reputación|reseña|review|estrella|opinión/.test(p)) return 'C';
    if (/contenido|blog|artículo|post/.test(p)) return 'C';
    if (/no.?convierte|sin.?resultados|tráfico.?sin/.test(p)) return 'C';

    return '?';
  }

  const byGroup: Record<string, Array<[string, number]>> = { A: [], B: [], C: [], '?': [] };

  top50.forEach(([prob, count]) => {
    const g = classify(prob);
    byGroup[g].push([prob, count]);
  });

  // Print grouped
  for (const [group, label] of [
    ['A', 'Debería matchear — patrón faltante o demasiado estricto'],
    ['C', 'Nueva oportunidad — INSPYRA podría venderlo'],
    ['B', 'No vendemos esto — correcto sin match'],
    ['?', 'Sin clasificar — revisar manualmente'],
  ] as const) {
    const items = byGroup[group];
    if (items.length === 0) continue;
    console.log(`\n[${group}] ${label} (${items.length}):`);
    items.forEach(([prob, count]) => {
      const bar = '█'.repeat(Math.min(count, 20));
      console.log(`  ${String(count).padStart(3)}x  ${bar}  "${prob}"`);
    });
  }

  console.log('\n' + '─'.repeat(100));
  console.log('Todos los problemas sin match fuera del top 50 (solo string, sin clasificar):');
  sorted.slice(50).forEach(([prob, count]) => {
    console.log(`  ${String(count).padStart(3)}x  "${prob}"`);
  });

  console.log('\n' + '═'.repeat(100));
  console.log(`RESUMEN: ${totalMatched}/${totalProblems} problemas matchean (${Math.round(totalMatched/totalProblems*100)}% cobertura del catálogo)`);
  console.log(`Únicos sin match: ${unmatchedFreq.size} · Únicos con match: ${matchedProblems.size}`);
  console.log(`Para referencia — 10 problemas que SÍ matchean:`);
  [...matchedProblems].slice(0, 10).forEach(p => console.log(`  ✓ "${p}"`));
  console.log('');
}

main().catch(console.error).finally(() => prisma.$disconnect());
