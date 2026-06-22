/**
 * CAPTURA DE PIPELINE COMPLETO
 *
 * Ejecuta el pipeline de análisis contra casa-vigil.com y captura:
 * 1. signals.json generado por Playwright
 * 2. Prompts exactos enviados a cada analyzer
 * 3. Respuestas raw de Claude antes del parseo
 * 4. Scores finales
 * 5. Output del ranker
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PlaywrightAuditService } from './modules/enrichment/playwright-audit.service';
import { OpportunityEngineService } from './modules/enrichment/opportunity-engine.service';
import * as fs from 'fs';
import * as path from 'path';

interface CapturedData {
  timestamp: string;
  website: string;
  signals: any;
  analyzers: {
    [key: string]: {
      prompt: string;
      rawResponse: string;
      parsedScore: number;
      priority: string;
    };
  };
  rankerInput: any;
  rankerOutput: any;
}

async function captureRawResponse(prompt: string, model: string = 'claude-sonnet-4-6'): Promise<string> {
  /**
   * Interceptar la llamada a Claude antes del parseo JSON
   * Esto requiere acceso a ClaudeRunnerService y capturar output raw
   */
  const fetch = require('node-fetch');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    return data.content?.[0]?.text ?? 'ERROR: No response text';
  } catch (err) {
    return `ERROR: ${(err as Error).message}`;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('CAPTURA DE PIPELINE COMPLETO');
  console.log('Target: casa-vigil.com');
  console.log('═══════════════════════════════════════════════════════\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const playwright = app.get(PlaywrightAuditService);
  const opportunity = app.get(OpportunityEngineService);

  const capturedData: CapturedData = {
    timestamp: new Date().toISOString(),
    website: 'https://casa-vigil.com',
    signals: {},
    analyzers: {},
    rankerInput: {},
    rankerOutput: {},
  };

  try {
    // PASO 1: CAPTURAR SIGNALS DE PLAYWRIGHT
    console.log('PASO 1: Ejecutando Playwright audit contra casa-vigil.com...\n');
    const signals = await playwright.auditWebsite('https://casa-vigil.com');
    capturedData.signals = signals;

    console.log('✓ Signals capturado. Resumen:');
    console.log(`  - accessible: ${signals.accessible}`);
    console.log(`  - hasSocialLinks: ${signals.hasSocialLinks}`);
    console.log(`  - socialLinksFound: ${JSON.stringify(signals.socialLinksFound)}`);
    console.log(`  - hasPhone: ${signals.hasPhone}`);
    console.log(`  - hasOnlineBooking: ${signals.hasOnlineBooking}`);
    console.log(`  - hasEcommerce: ${signals.hasEcommerce}`);
    console.log(`  - hasContactForm: ${signals.hasContactForm}`);
    console.log(`  - hasAnalytics: ${signals.hasAnalytics}`);
    console.log(`  - hasMetaPixel: ${signals.hasMetaPixel}\n`);

    // PASO 2: PREPARAR CONTEXTO PARA ANALYZERS
    const prospect = {
      nombreEmpresa: 'Casa Vigil / Universo Vigil',
      rubro: 'Hospedaje / Turismo',
      ciudad: 'Mendoza',
      pais: 'Argentina',
      website: 'casa-vigil.com',
      problemasEncontrados: [] as string[],
    };

    console.log('PASO 2: Preparando contexto de negocio...\n');
    console.log('Contexto enviado a analyzers:');
    console.log(JSON.stringify(prospect, null, 2));
    console.log('\n');

    // PASO 3: EJECUTAR ANALYZERS Y CAPTURAR PROMPTS + RESPUESTAS
    console.log('PASO 3: Ejecutando 6 analyzers en paralelo...\n');

    // Importar prompts para poder mostrar exactamente qué se envía
    const { SEO_ANALYZER_PROMPT } = require('./modules/enrichment/analyzers/seo.prompt');
    const { ECOMMERCE_ANALYZER_PROMPT } = require('./modules/enrichment/analyzers/ecommerce.prompt');
    const { BOOKING_ANALYZER_PROMPT } = require('./modules/enrichment/analyzers/booking.prompt');
    const { CRM_ANALYZER_PROMPT } = require('./modules/enrichment/analyzers/crm.prompt');
    const { CRO_ANALYZER_PROMPT } = require('./modules/enrichment/analyzers/cro.prompt');
    const { WEB_ANALYZER_PROMPT } = require('./modules/enrichment/analyzers/web.prompt');

    const analyzerDefinitions = [
      { key: 'SEO', promptFn: SEO_ANALYZER_PROMPT },
      { key: 'ECOMMERCE', promptFn: ECOMMERCE_ANALYZER_PROMPT },
      { key: 'BOOKING', promptFn: BOOKING_ANALYZER_PROMPT },
      { key: 'CRM', promptFn: CRM_ANALYZER_PROMPT },
      { key: 'CRO', promptFn: CRO_ANALYZER_PROMPT },
      { key: 'WEB', promptFn: WEB_ANALYZER_PROMPT },
    ];

    for (const { key, promptFn } of analyzerDefinitions) {
      const exactPrompt = promptFn(prospect, signals);
      console.log(`\n${'═'.repeat(60)}`);
      console.log(`ANALYZER: ${key}`);
      console.log(`${'═'.repeat(60)}`);

      console.log('\n📝 PROMPT EXACTO ENVIADO A CLAUDE:\n');
      console.log(exactPrompt);
      console.log('\n' + '─'.repeat(60));

      // Capturar respuesta raw
      console.log(`\n⏳ Esperando respuesta de Claude...\n`);
      const rawResponse = await captureRawResponse(exactPrompt);

      console.log('🔤 RESPUESTA RAW DE CLAUDE (antes del parseo):\n');
      console.log(rawResponse);
      console.log('\n' + '─'.repeat(60));

      // Intentar parsear para extraer score
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      let parsedScore = 0;
      let priority = 'UNKNOWN';

      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          parsedScore = parsed.score ?? 0;
          priority = parsed.priority ?? 'UNKNOWN';
          console.log(`\n✓ PARSED: score=${parsedScore}, priority=${priority}`);
        } catch {
          console.log('\n✗ No se pudo parsear JSON');
        }
      }

      capturedData.analyzers[key] = {
        prompt: exactPrompt,
        rawResponse,
        parsedScore,
        priority,
      };
    }

    // PASO 4: EJECUTAR RANKER
    console.log(`\n\n${'═'.repeat(60)}`);
    console.log('PASO 4: RANKER');
    console.log(`${'═'.repeat(60)}\n`);

    // Ejecutar análisis completo para obtener scores finales
    const fullAnalysis = await opportunity.analyze(
      'capture-pipeline-job',
      prospect,
      signals,
    );

    capturedData.rankerInput = {
      description: 'Array de scores de los 6 analyzers (entrada al ranker)',
      values: Object.entries(capturedData.analyzers).map(([key, data]) => ({
        service: key,
        score: data.parsedScore,
        priority: data.priority,
      })),
    };

    capturedData.rankerOutput = fullAnalysis;

    console.log('INPUT AL RANKER:');
    console.log(JSON.stringify(capturedData.rankerInput, null, 2));

    console.log('\n' + '─'.repeat(60));
    console.log('\nOUTPUT FINAL DEL RANKER:');
    console.log(JSON.stringify(fullAnalysis, null, 2));

    // GUARDAR TODO A ARCHIVO
    const outputPath = path.join(
      __dirname,
      `../../casa-vigil-pipeline-capture-${Date.now()}.json`,
    );
    fs.writeFileSync(outputPath, JSON.stringify(capturedData, null, 2));
    console.log(`\n✓ Datos completos guardados en: ${outputPath}`);

  } catch (err) {
    console.error('ERROR durante captura:', err);
  } finally {
    await app.close();
  }
}

main().catch(console.error);
