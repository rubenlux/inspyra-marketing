import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ResearchService } from './src/modules/research/research.service';

async function deb() {
  const app = await NestFactory.createApplicationContext(AppModule);
  if (!app) { console.error("Could not bootstrap App"); return; }
  
  const researchService = app.get(ResearchService);
  
  console.log("Running discoverRealWithWebSearch...");
  try {
      const prompt = `Usa web_search para buscar: "Bodegas en Mendoza"

Solo incluí empresas que aparecieron explícitamente en los resultados. Devuelve un JSON.`;

      // Call spawnClaudeAgentic directly to see raw output
      const raw = await researchService['spawnClaudeAgentic'](prompt, 'claude-sonnet-4-6', 60_000, 180_000);
      console.log("RAW OUTPUT:");
      console.log(raw);
  } catch(e) {
      console.error(e);
  }
  await app.close();
}

deb().catch(e => console.error(e));
