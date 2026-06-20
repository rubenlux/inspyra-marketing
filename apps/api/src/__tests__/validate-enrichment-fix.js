// BUG-003 validation — tests the new spawnClaudeAgentic approach (stream-json + idle timeout)
// Run: node apps/api/src/__tests__/validate-enrichment-fix.js
const { spawn } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../../../../../');

const TEST_PROSPECT = {
  nombreEmpresa: 'Bufete Jurídico Cortés',
  rubro: 'Estudio jurídico',
  ciudad: 'La Plata',
  pais: 'Argentina',
  website: null,
  instagram: null,
  linkedin: null,
  oportunidadDetectada: 'Sin web ni presencia digital',
};

function buildPrompt(p) {
  return `Eres un agente de enriquecimiento de leads B2B. Encontrá datos de contacto reales de esta empresa latinoamericana.

EMPRESA:
- Nombre: ${p.nombreEmpresa}
- Rubro: ${p.rubro}
- Ubicación: ${[p.ciudad, p.pais].filter(Boolean).join(', ')}
- Website: Sin web conocida
- Instagram: Desconocido
- LinkedIn: Desconocido
- Oportunidad: ${p.oportunidadDetectada}

INSTRUCCIONES — MÁXIMO 4 herramientas en total:
1. Si hay website: WebFetch para extraer email, teléfono, formulario, redes sociales
2. Si no hay suficiente info: WebSearch "${p.nombreEmpresa} ${p.ciudad} contacto"
3. Solo si no encontraste nada: buscar LinkedIn o Google Business
4. Identificar decisor (dueño, fundador, gerente) si aparece en los resultados anteriores
confianza: ALTA=datos reales del sitio, MEDIA=redes sociales, BAJA=inferido

Responde SOLO con JSON válido, sin texto adicional:
{"email":null,"telefono":null,"whatsapp":null,"formularioWeb":null,"googleBusiness":null,"linkedin":null,"facebook":null,"instagram":null,"direccion":null,"anioFundacion":null,"empleadosReal":null,"nombreDecidsor":null,"rolDecidsor":null,"linkedinDecidsor":null,"confianza":"BAJA"}`;
}

function spawnClaudeAgentic(prompt, model, idleTimeoutMs, totalTimeoutMs) {
  return new Promise((resolve, reject) => {
    const args = [
      '-p', '-',
      '--output-format', 'stream-json',
      '--verbose',
      '--dangerously-skip-permissions',
      '--strict-mcp-config',
      '--model', model,
      '--allowedTools', 'WebFetch,WebSearch',
    ];

    console.log(`\n[BEFORE] Model: ${model}`);
    console.log(`[BEFORE] Args: ${args.join(' ')}`);
    const startMs = Date.now();
    let eventCount = 0;

    const child = spawn('claude', args, {
      cwd: projectRoot,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    child.stdin.write(prompt, 'utf8');
    child.stdin.end();

    let stderr = '';
    let lineBuffer = '';
    let settled = false;

    const done = (err, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(totalTimer);
      clearTimeout(idleTimer);
      const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
      if (err) {
        console.error(`\n[AFTER] FAILED in ${elapsed}s: ${err.message}`);
        reject(err);
      } else {
        const chars = result.length;
        console.log(`\n[AFTER] COMPLETED in ${elapsed}s | ${chars} chars | ${eventCount} events`);
        resolve({ result, elapsed, chars, eventCount });
      }
    };

    const totalTimer = setTimeout(() => {
      child.kill('SIGTERM');
      done(new Error(`Timeout ${model} after ${totalTimeoutMs / 60000}min`));
    }, totalTimeoutMs);

    let idleTimer = setTimeout(() => {
      child.kill('SIGTERM');
      done(new Error(`Idle timeout ${model}: no output for ${idleTimeoutMs / 1000}s`));
    }, idleTimeoutMs);

    child.stdout.on('data', (chunk) => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        child.kill('SIGTERM');
        done(new Error(`Idle timeout ${model}: no output for ${idleTimeoutMs / 1000}s`));
      }, idleTimeoutMs);

      lineBuffer += chunk.toString();
      const lines = lineBuffer.split('\n');
      lineBuffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          eventCount++;
          const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
          if (event.type === 'assistant') {
            const types = (event.message?.content ?? []).map(c => c.type).join(',');
            console.log(`  [${elapsed}s] assistant → ${types}`);
          } else if (event.type === 'tool') {
            console.log(`  [${elapsed}s] tool → ${event.tool_name}(${JSON.stringify(event.tool_input ?? {}).slice(0, 60)})`);
          } else if (event.type === 'result') {
            console.log(`  [${elapsed}s] result → subtype: ${event.subtype}`);
            if (event.subtype === 'success') {
              done(undefined, event.result ?? '');
            } else {
              done(new Error(`claude result error: ${JSON.stringify(event).slice(0, 200)}`));
            }
          }
        } catch { /* partial line */ }
      }
    });

    child.stderr.on('data', (c) => { stderr += c.toString(); });
    child.on('close', (code) => {
      if (settled) return;
      if (code === 0) done(new Error('claude closed without result event'));
      else done(new Error(`claude exited ${code}. stderr: ${stderr.slice(-300)}`));
    });
    child.on('error', done);
  });
}

async function main() {
  console.log('=== BUG-003 Enrichment Fix Validation ===');
  console.log(`Prospect: ${TEST_PROSPECT.nombreEmpresa} (${TEST_PROSPECT.ciudad})`);
  console.log('Idle timeout: 60s | Total timeout: 240s\n');

  const prompt = buildPrompt(TEST_PROSPECT);
  console.log(`Prompt size: ${prompt.length} chars`);

  try {
    const { result, elapsed, chars } = await spawnClaudeAgentic(
      prompt,
      'claude-sonnet-4-6',
      60_000,
      240_000,
    );

    console.log(`\n--- RAW OUTPUT (${chars} chars) ---`);
    console.log(result.slice(0, 500));

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('\n--- PARSED JSON ---');
      console.log(JSON.stringify(parsed, null, 2));
      console.log('\n✅ PASS — Enrichment completed in', elapsed + 's');
    } else {
      console.log('\n⚠️  No JSON found in output');
    }
  } catch (err) {
    console.error('\n❌ FAIL:', err.message);
    process.exit(1);
  }
}

main();
