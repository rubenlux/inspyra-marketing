#!/bin/bash

# CAPTURA DE PIPELINE COMPLETO
# Ejecuta el pipeline de análisis contra casa-vigil.com en vivo

API="http://localhost:3001/api/v1"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
OUTPUT_FILE="casa-vigil-pipeline-${TIMESTAMP// /_}.json"

echo "═══════════════════════════════════════════════════════"
echo "CAPTURA DE PIPELINE COMPLETO - CASA VIGIL"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "⏳ Iniciando auditoría de casa-vigil.com..."
echo "⏳ API: $API"
echo "⏳ Output: $OUTPUT_FILE"
echo ""

# PASO 1: Autenticar y obtener token
echo "PASO 1: Autenticación..."
echo ""

AUTH_RESPONSE=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@inspyra.io",
    "password": "Admin1234!"
  }')

TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error: No se pudo obtener token de autenticación"
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi

echo "✓ Token obtenido: ${TOKEN:0:20}..."
echo ""

# PASO 2: Auditar sitio web
echo "═══════════════════════════════════════════════════════"
echo "PASO 2: Auditar casa-vigil.com con Playwright"
echo "═══════════════════════════════════════════════════════"
echo ""

echo "⏳ Ejecutando Playwright audit..."

AUDIT_RESPONSE=$(curl -s -X POST "$API/enrichment/audit-website" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://casa-vigil.com"
  }')

echo "✓ Signals capturado. Mostrando resumen..."
echo ""
echo "$AUDIT_RESPONSE" | python3 -m json.tool | head -50

SIGNALS_JSON="$AUDIT_RESPONSE"

# PASO 3: Ejecutar análisis de oportunidad
echo ""
echo "═══════════════════════════════════════════════════════"
echo "PASO 3: Ejecutar análisis de oportunidad"
echo "═══════════════════════════════════════════════════════"
echo ""

ANALYSIS_RESPONSE=$(curl -s -X POST "$API/research/business-opportunity" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "empresa": "Casa Vigil / Universo Vigil",
    "rubro": "Hospedaje / Turismo",
    "website": "https://casa-vigil.com",
    "googleMapsData": {}
  }')

echo "✓ Análisis completado. Mostrando resultado..."
echo ""
echo "$ANALYSIS_RESPONSE" | python3 -m json.tool

# PASO 4: Compilar output final
echo ""
echo "═══════════════════════════════════════════════════════"
echo "PASO 4: Compilando datos capturados"
echo "═══════════════════════════════════════════════════════"
echo ""

cat > "$OUTPUT_FILE" << EOF
{
  "timestamp": "$TIMESTAMP",
  "website": "https://casa-vigil.com",
  "company": "Casa Vigil / Universo Vigil",
  "signals": $SIGNALS_JSON,
  "analysis": $ANALYSIS_RESPONSE
}
EOF

echo "✓ Datos guardados en: $OUTPUT_FILE"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "CAPTURA COMPLETADA"
echo "═══════════════════════════════════════════════════════"
