const { JwtService } = require('@nestjs/jwt');
const fs = require('fs');
const path = require('path');

// Basic .env parser
function loadEnv() {
  const envPath = path.resolve(__dirname, '.env');
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1');
  });
  return env;
}

async function run() {
  const env = loadEnv();
  const secret = env.JWT_SECRET || 'dev_secret_change_in_prod';
  
  const jwt = new JwtService({ secret });
  const token = jwt.sign(
    {
      sub: "9a0db32d-6f3b-4f9e-ba11-97817a7ddb80",
      tenantId: "483e19af-46e0-480e-a4ea-5e8513216ef9",
      scopes: ["admin"],
      type: "service"
    },
    { expiresIn: "1h" }
  );

  const payload = {
    query: "Bodegas Mendoza",
    limit: 25
  };

  console.log('Using secret:', secret.slice(0, 5) + '...');
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
  console.log('Job Created Successfully:', JSON.stringify(job, null, 2));
}

run().catch(console.error);
