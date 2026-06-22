import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('EXTRAYENDO DATOS HISTÓRICOS DE ENRIQUECIMIENTO\n');

  // IDs de los resultados
  const resultIds = [
    'bfc49c51-9b69-4c90-a1dd-a56f38688bd9', // Casa Vigil Bodega
    '232731b8-e301-4f4f-80df-bf40fe2ce7d2', // Bodegas López
    'a7702fce-94da-43b0-9830-c8283e386726', // Bodega Norton
    'ea539eea-37e2-48a7-81ee-a96d80d988d9', // Bodega Pulenta Estate
  ];

  for (const resultId of resultIds) {
    try {
      const result = await prisma.enrichmentResult.findUnique({
        where: { id: resultId },
        include: {
          prospect: {
            select: {
              nombreEmpresa: true,
              rubro: true,
              website: true,
            },
          },
        },
      });

      if (!result) {
        console.log(`❌ No encontrado: ${resultId}\n`);
        continue;
      }

      console.log('═'.repeat(60));
      console.log(`EMPRESA: ${result.prospect.nombreEmpresa}`);
      console.log(`RUBRO: ${result.prospect.rubro}`);
      console.log(`WEBSITE: ${result.prospect.website}`);
      console.log(`CREATED: ${result.createdAt}`);
      console.log('═'.repeat(60));
      console.log('');

      console.log('## SIGNALS.JSON');
      console.log(JSON.stringify(result.signals, null, 2));
      console.log('');

      console.log('## RAW OUTPUT');
      console.log(result.rawOutput || '(vacío)');
      console.log('');

      console.log('## OPPORTUNITIES');
      console.log(JSON.stringify(result.opportunities, null, 2));
      console.log('');

      console.log('## SCORES');
      console.log(`- opportunityScore: ${result.opportunityScore}`);
      console.log(`- priority: ${result.priority}`);
      console.log(`- confianza: ${result.confianza}`);
      console.log(`- estimatedTicket: ${result.estimatedTicket}`);
      console.log('');

      console.log('## SUMMARY');
      console.log(result.summary || '(vacío)');
      console.log('\n\n');
    } catch (err) {
      console.error(`Error al extraer ${resultId}:`, err);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
