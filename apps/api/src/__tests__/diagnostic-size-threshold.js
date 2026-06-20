// Binary search: find prompt size threshold where spawn stops working
const { spawn } = require('child_process');

function runSpawn(prompt, label) {
  return new Promise((resolve) => {
    const start = Date.now();
    process.stdout.write(label + ' (' + prompt.length + ' chars)... ');

    const child = spawn('claude', [
      '-p', '-',
      '--output-format', 'text',
      '--dangerously-skip-permissions',
      '--model', 'claude-haiku-4-5-20251001',  // use Haiku (faster) to isolate size issue
    ], {
      cwd: 'c:/Users/ruben/Documents/Mis-Proyectos/inspyra-marketing',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    child.stdin.write(prompt, 'utf8');
    child.stdin.end();

    let stdout = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', () => {});

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log('TIMEOUT ' + elapsed + 's (0 output)');
      resolve({ ok: false, elapsed });
    }, 30000);

    child.on('close', (code) => {
      clearTimeout(timer);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      if (code === 0 && stdout.length > 0) {
        console.log('OK ' + elapsed + 's (' + stdout.length + ' chars output)');
        resolve({ ok: true, elapsed });
      } else {
        console.log('FAIL code=' + code + ' ' + elapsed + 's (' + stdout.length + ' output)');
        resolve({ ok: false, elapsed });
      }
    });
  });
}

async function main() {
  const base = 'Responde solo con la palabra: OK';
  const filler = ' Esta es una empresa: {"nombre":"Test","rubro":"Legal","ciudad":"La Plata"}.';

  // Test at different sizes
  const sizes = [
    { label: '32 chars', prompt: base },
    { label: '500 chars', prompt: base + filler.repeat(7) },
    { label: '1000 chars', prompt: base + filler.repeat(14) },
    { label: '2000 chars', prompt: base + filler.repeat(28) },
    { label: '4000 chars', prompt: base + filler.repeat(56) },
    { label: '6000 chars', prompt: base + filler.repeat(84) },
    { label: '8000 chars', prompt: base + filler.repeat(112) },
    { label: '12000 chars', prompt: base + filler.repeat(168) },
  ];

  for (const { label, prompt } of sizes) {
    await runSpawn(prompt, label);
    await new Promise(r => setTimeout(r, 500));
  }
  process.exit(0);
}

main();
