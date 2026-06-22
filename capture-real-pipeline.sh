#!/bin/bash

# CAPTURA REAL DE PIPELINE
# Usa endpoints que existen en el API

API="http://localhost:3001/api/v1"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
OUTPUT_FILE="casa-vigil-real-data-${TIMESTAMP// /_}.json"

echo "═══════════════════════════════════════════════════════"
echo "CAPTURA REAL DE PIPELINE - CASA VIGIL"
echo "═══════════════════════════════════════════════════════"
echo ""

# Autenticar
echo "Autenticando..."
AUTH=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@inspyra.io","password":"Admin1234!"}')

TOKEN=$(echo "$AUTH" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "✓ Token: ${TOKEN:0:20}..."

# Usar el endpoint /research/website-audit (correcto)
echo ""
echo "Ejecutando website-audit contra casa-vigil.com..."
SIGNALS=$(curl -s -X POST "$API/research/website-audit" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://casa-vigil.com"}')

echo "Response signals:"
echo "$SIGNALS" | head -c 500
echo "..."

# Guardar todo
cat > "$OUTPUT_FILE" << 'EOF'
CAPTURA REAL DE PIPELINE

Endpoint: POST /api/v1/research/website-audit
URL: https://casa-vigil.com

SIGNALS RESPONSE:
EOF

echo "$SIGNALS" >> "$OUTPUT_FILE"

echo ""
echo "Datos guardados en: $OUTPUT_FILE"
