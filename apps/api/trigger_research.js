const { spawn } = require('child_process');

async function run() {
  // Generate token
  const token = await new Promise((resolve) => {
    const cp = spawn('npx', ['ts-node', 'gen-token.ts'], { cwd: __dirname });
    let output = '';
    cp.stdout.on('data', (d) => output += d.toString());
    cp.on('close', () => resolve(output.trim()));
  });

  console.log('Token generated.');

  const payload = {
    query: "Bodegas Mendoza",
    limit: 25
  };

  console.log('Executing Research Job...');
  const response = await fetch('http://localhost:3001/api/v1/research/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const txt = await response.text();
    console.error(`Error: ${response.status} - ${txt}`);
    process.exit(1);
  }

  const job = await response.json();
  console.log('Job Created:', job.id);
  console.log('Status:', job.status);
  
  // Save Job ID to a file for monitoring
  require('fs').writeFileSync('current_job.txt', job.id);
}

run().catch(console.error);
