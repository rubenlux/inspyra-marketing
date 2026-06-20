// Diagnostic: does removing website URLs fix the timeout?
// Test A: 20 companies WITH website URLs (current behavior)
// Test B: 20 companies WITHOUT website URLs
const { spawn } = require('child_process');

function makeCompany(i, withUrl) {
  const c = {
    _originalIndex: i,
    nombreEmpresa: 'Empresa Test ' + i,
    ciudad: 'La Plata',
    rubro: 'Estudio juridico',
    presenciaDigital: { tieneWeb: true, tieneSeo: false, tieneRedes: false, tieneEcommerce: false, tieneAgendaOnline: false },
    facturacionEstimada: 'pequena',
    empleadosEstimado: 8,
  };
  if (withUrl) {
    c.website = 'empresa' + i + '-test.com.ar';
    c.instagram = '@empresa' + i;
    c.linkedin = 'linkedin.com/company/empresa' + i;
  }
  return c;
}

function makePrompt(companies) {
  return [
    'Evalua estas ' + companies.length + ' empresas. NO uses herramientas. SOLO JSON.',
    'PROMOTE si score >= 60. DISCARD si < 60.',
    'EMPRESAS:',
    JSON.stringify(companies, null, 2),
    'FORMATO: [{"index":<_originalIndex>,"action":"PROMOTE","score":75,"reasoning":"1 oracion."}]',
    'SOLO el JSON array.',
  ].join('\n');
}

function runTest(label, prompt, callback) {
  console.log('\n=== ' + label + ' ===');
  console.log('Prompt size:', prompt.length, 'chars');

  const start = Date.now();
  const child = spawn('claude', ['-p', '-', '--output-format', 'text', '--dangerously-skip-permissions', '--model', 'claude-sonnet-4-6'], {
    cwd: 'c:/Users/ruben/Documents/Mis-Proyectos/inspyra-marketing',
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  child.stdin.write(prompt, 'utf8');
  child.stdin.end();

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (d) => { stdout += d; });
  child.stderr.on('data', (d) => { stderr += d; });

  const timer = setTimeout(() => {
    child.kill('SIGTERM');
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log('TIMEOUT at', elapsed, 's — stdout:', stdout.length, 'chars, stderr:', stderr.slice(0, 200));
    callback(null);
  }, 45000);

  child.on('close', (code) => {
    clearTimeout(timer);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log('Exit:', code, '| Elapsed:', elapsed, 's | Stdout:', stdout.length, 'chars');
    if (stderr) console.log('Stderr (200):', stderr.slice(0, 200));
    console.log('Output preview:', stdout.slice(0, 150));
    callback(stdout);
  });
}

const companiesWithUrl = Array(20).fill(null).map((_, i) => makeCompany(i, true));
const companiesNoUrl = Array(20).fill(null).map((_, i) => makeCompany(i, false));

// Run test A (with URLs) first, then test B (without URLs)
runTest('TEST A — 20 companies WITH website/instagram/linkedin URLs', makePrompt(companiesWithUrl), (resultA) => {
  runTest('TEST B — 20 companies WITHOUT any URLs', makePrompt(companiesNoUrl), (resultB) => {
    console.log('\n=== CONCLUSION ===');
    console.log('A (with URLs):', resultA ? 'completed' : 'TIMEOUT');
    console.log('B (no URLs):', resultB ? 'completed' : 'TIMEOUT');
    process.exit(0);
  });
});
