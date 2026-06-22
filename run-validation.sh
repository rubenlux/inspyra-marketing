#!/bin/bash

# VALIDACIÓN EMPÍRICA: Business Opportunity Engine
# Ejecutar cuando: BD está corriendo + API reiniciado

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNTA2NjQyOC02NDJiLTQxM2QtOWI3My1mYjg0MzM3ZjVmMjUiLCJlbWFpbCI6InZhbGlkYXRpb25AdGVzdC5jb20iLCJyb2xlIjoiZWRpdG9yIiwiaWF0IjoxNzgyMTM3OTQ2LCJleHAiOjE3ODI3NDI3NDZ9.3RWxijS3b0PJhKAB5HDrPNKiMimwqgZ8ke-WvRPdVHU"
BASE_URL="http://localhost:5000/research/business-opportunity"

echo "=================================================="
echo "VALIDACIÓN EMPÍRICA: Business Opportunity Engine"
echo "=================================================="
echo ""

declare -a RESULTS
declare -a TOP_SERVICES

# ===== CASO 1: Bodega sin Ecommerce =====
echo "[1/5] BODEGA SIN ECOMMERCE"
echo "============================"

RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "empresa": "Bodegas Mendoza",
    "rubro": "Distribuidor de vinos y bebidas",
    "website": "bodegas-mendoza.com.ar",
    "googleMapsData": {
      "rating": 4.8,
      "reviews": 120,
      "phone": "+54 261 555 1234",
      "address": "Luján de Cuyo, Mendoza"
    }
  }')

echo "$RESPONSE" > /tmp/result1.json
echo "Full response: $RESPONSE"
echo ""

TOP_SERVICE=$(echo "$RESPONSE" | grep -o '"topServices":\[\s*"[^"]*' | head -1 | sed 's/.*"\([^"]*\)"/\1/')
RESULTS[1]="$TOP_SERVICE"
TOP_SERVICES[1]=$(echo "$RESPONSE" | grep -o '"topServices":\[[^]]*' | sed 's/.*\[\(.*\)/\1/')

echo "✓ Oportunidad principal: $TOP_SERVICE"
echo "  Esperado: Ecommerce Setup"
if [ "$TOP_SERVICE" = "Ecommerce Setup" ]; then
  echo "  ✅ PASÓ"
else
  echo "  ❌ FALLÓ"
fi
echo ""
echo ""

# ===== CASO 2: Restaurante sin Reservas =====
echo "[2/5] RESTAURANTE SIN RESERVAS ONLINE"
echo "======================================"

RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "empresa": "El Chulito",
    "rubro": "Restaurante",
    "website": "elchulito.com.ar",
    "googleMapsData": {
      "rating": 4.6,
      "reviews": 340,
      "address": "Centro, CABA",
      "types": ["restaurant"]
    }
  }')

echo "$RESPONSE" > /tmp/result2.json
echo "Full response: $RESPONSE"
echo ""

TOP_SERVICE=$(echo "$RESPONSE" | grep -o '"topServices":\[\s*"[^"]*' | head -1 | sed 's/.*"\([^"]*\)"/\1/')
RESULTS[2]="$TOP_SERVICE"
TOP_SERVICES[2]=$(echo "$RESPONSE" | grep -o '"topServices":\[[^]]*' | sed 's/.*\[\(.*\)/\1/')

echo "✓ Oportunidad principal: $TOP_SERVICE"
echo "  Esperado: Sistema de Reservas Online"
if [ "$TOP_SERVICE" = "Sistema de Reservas Online" ]; then
  echo "  ✅ PASÓ"
else
  echo "  ❌ FALLÓ"
fi
echo ""
echo ""

# ===== CASO 3: Salón de Belleza =====
echo "[3/5] SALÓN DE BELLEZA SIN CRM"
echo "================================"

RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "empresa": "Beauty Studio Aurora",
    "rubro": "Salón de belleza y estética",
    "website": "beautystudioaurora.com.ar",
    "googleMapsData": {
      "rating": 4.9,
      "reviews": 280,
      "phone": "+54 11 4567 8901",
      "types": ["beauty_salon"]
    }
  }')

echo "$RESPONSE" > /tmp/result3.json
echo "Full response: $RESPONSE"
echo ""

TOP_SERVICE=$(echo "$RESPONSE" | grep -o '"topServices":\[\s*"[^"]*' | head -1 | sed 's/.*"\([^"]*\)"/\1/')
RESULTS[3]="$TOP_SERVICE"
TOP_SERVICES[3]=$(echo "$RESPONSE" | grep -o '"topServices":\[[^]]*' | sed 's/.*\[\(.*\)/\1/')

echo "✓ Oportunidad principal: $TOP_SERVICE"
echo "  Esperado: Sistema de Reservas Online O Setup CRM"
if [[ "$TOP_SERVICE" == "Sistema de Reservas Online" || "$TOP_SERVICE" == "Setup CRM" ]]; then
  echo "  ✅ PASÓ"
else
  echo "  ❌ FALLÓ"
fi
echo ""
echo ""

# ===== CASO 4: Inmobiliaria =====
echo "[4/5] INMOBILIARIA SIN LEAD CAPTURE"
echo "===================================="

RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "empresa": "Propiedades del Sur",
    "rubro": "Inmobiliaria / Broker de propiedades",
    "website": "propiedadesdelsur.com.ar",
    "googleMapsData": {
      "rating": 4.3,
      "reviews": 95,
      "address": "La Plata, Buenos Aires"
    }
  }')

echo "$RESPONSE" > /tmp/result4.json
echo "Full response: $RESPONSE"
echo ""

TOP_SERVICE=$(echo "$RESPONSE" | grep -o '"topServices":\[\s*"[^"]*' | head -1 | sed 's/.*"\([^"]*\)"/\1/')
RESULTS[4]="$TOP_SERVICE"
TOP_SERVICES[4]=$(echo "$RESPONSE" | grep -o '"topServices":\[[^]]*' | sed 's/.*\[\(.*\)/\1/')

echo "✓ Oportunidad principal: $TOP_SERVICE"
echo "  Esperado: Captura de Leads (Formulario + CRM)"
if [ "$TOP_SERVICE" = "Captura de Leads (Formulario + CRM)" ]; then
  echo "  ✅ PASÓ"
else
  echo "  ❌ FALLÓ"
fi
echo ""
echo ""

# ===== CASO 5: Consultora sin Web =====
echo "[5/5] CONSULTORA SIN PRESENCIA WEB"
echo "==================================="

RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "empresa": "Tech Consulting Solutions",
    "rubro": "Consultoría empresarial / TI",
    "website": null,
    "googleMapsData": null,
    "contactData": {
      "type": "consultant",
      "source": "google_maps_search"
    }
  }')

echo "$RESPONSE" > /tmp/result5.json
echo "Full response: $RESPONSE"
echo ""

TOP_SERVICE=$(echo "$RESPONSE" | grep -o '"topServices":\[\s*"[^"]*' | head -1 | sed 's/.*"\([^"]*\)"/\1/')
RESULTS[5]="$TOP_SERVICE"
TOP_SERVICES[5]=$(echo "$RESPONSE" | grep -o '"topServices":\[[^]]*' | sed 's/.*\[\(.*\)/\1/')

echo "✓ Oportunidad principal: $TOP_SERVICE"
echo "  Esperado: Sitio Web Nuevo"
if [ "$TOP_SERVICE" = "Sitio Web Nuevo" ]; then
  echo "  ✅ PASÓ"
else
  echo "  ❌ FALLÓ"
fi
echo ""
echo ""

# ===== ANÁLISIS FINAL =====
echo "=================================================="
echo "RESUMEN DE RESULTADOS"
echo "=================================================="
echo ""
echo "Caso 1 - Bodega:         ${RESULTS[1]}"
echo "Caso 2 - Restaurante:    ${RESULTS[2]}"
echo "Caso 3 - Salón:          ${RESULTS[3]}"
echo "Caso 4 - Inmobiliaria:   ${RESULTS[4]}"
echo "Caso 5 - Consultora:     ${RESULTS[5]}"
echo ""
echo "Preguntas críticas:"
echo "  1. ¿SEO apareció como oportunidad #1? "
SEO_COUNT=0
for i in 1 2 3 4 5; do
  if [[ "${RESULTS[$i]}" == *"SEO"* ]]; then
    echo "     Caso $i: SÍ (${RESULTS[$i]})"
    ((SEO_COUNT++))
  fi
done
echo "     Total SEO como #1: $SEO_COUNT / 5 (esperado: 0)"
echo ""

echo "  2. ¿Cuántas veces SEO en top 3?"
for i in 1 2 3 4 5; do
  echo "     Caso $i: ${TOP_SERVICES[$i]}"
done
echo ""

echo "  3. ¿Servicios TIER 1 en posición 1-2?"
TIER1_COUNT=0
for i in 1 2 3 4 5; do
  if [[ "${RESULTS[$i]}" == *"Ecommerce"* || "${RESULTS[$i]}" == *"Reservas"* || "${RESULTS[$i]}" == *"CRM"* || "${RESULTS[$i]}" == *"Email"* ]]; then
    ((TIER1_COUNT++))
  fi
done
echo "     TIER 1 servicios: $TIER1_COUNT / 5 (esperado: ≥ 4)"
echo ""

echo "=================================================="
echo "JSON completo guardado en:"
echo "  /tmp/result1.json - Bodega"
echo "  /tmp/result2.json - Restaurante"
echo "  /tmp/result3.json - Salón"
echo "  /tmp/result4.json - Inmobiliaria"
echo "  /tmp/result5.json - Consultora"
echo "=================================================="
