const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YTBkYjMyZC02ZjNiLTRmOWUtYmExMS05NzgxN2E3ZGRiODAiLCJhZ2VudElkIjoib3Bwb3J0dW5pdHkiLCJ0ZW5hbnRJZCI6IjQ4M2UxOWFmLTQ2ZTAtNDgwZS1hNGVhLTVlODUxMzIxNmVmOSIsInNjb3BlcyI6WyJwcm9zcGVjdHMucmVhZCIsInByb3NwZWN0cy51cGRhdGUiLCJpbnRlbC5yZWFkIiwiY2F0YWxvZy5yZWFkIiwicHJvc3BlY3QtdmFsaWRhdGlvbnMuY3JlYXRlIiwicHJvc3BlY3QtdmFsaWRhdGlvbnMucmVhZCIsInBlcmNlcnRpbGUucmVhZCIsImRhdGEtYXVkaXQucmVhZCIsImRpc2NvdmVyeS5yZWFkIiwiYWRtaW4ucmVhZCJdLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc1MDQ3NzQ5NSwiZXhwIjoxODEzNTIzNDk1fQ.xXodKi_YjigaDEa8aJNfAsLPapw7O0NHnHD8QMEn7Og";

async function run() {
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
  console.log('Job Created:', JSON.stringify(job.data || job, null, 2));
}

run().catch(console.error);
