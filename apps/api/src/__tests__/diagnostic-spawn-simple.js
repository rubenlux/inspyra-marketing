// Isolate: does Node.js spawn produce output for a trivial prompt?
const { spawn } = require('child_process');

const prompt = 'Responde solo con la palabra: OK';

console.log('Prompt:', prompt);
console.log('Starting via Node.js spawn (same args as spawnClaudeText)...');

const start = Date.now();

const child = spawn('claude', [
  '-p', '-',
  '--output-format', 'text',
  '--dangerously-skip-permissions',
  '--model', 'claude-sonnet-4-6',
], {
  cwd: 'c:/Users/ruben/Documents/Mis-Proyectos/inspyra-marketing',
  stdio: ['pipe', 'pipe', 'pipe'],
});

child.stdin.write(prompt, 'utf8');
child.stdin.end();

let stdout = '';
let stderr = '';

child.stdout.on('data', (d) => { stdout += d; process.stdout.write('[GOT STDOUT: ' + d.toString().slice(0,50) + ']'); });
child.stderr.on('data', (d) => { stderr += d.toString(); });

child.on('close', (code) => {
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log('\nExit:', code, '| Elapsed:', elapsed, 's');
  console.log('Stdout:', JSON.stringify(stdout));
  if (stderr) console.log('Stderr (500):', stderr.slice(0, 500));
  process.exit(0);
});

setTimeout(() => {
  console.log('\nTIMEOUT 30s — child still running');
  console.log('Stdout so far:', JSON.stringify(stdout));
  if (stderr) console.log('Stderr:', stderr.slice(0, 500));
  child.kill('SIGTERM');
  process.exit(1);
}, 30000);
