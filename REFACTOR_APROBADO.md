# REFACTOR APROBADO: BUSINESS CONTEXT ENGINE v3
## Separación de Business Classification y Website Analysis

**Fecha:** 2026-06-22  
**Status:** ✅ IMPLEMENTADO  
**Next:** Testing Stage A (20 casos)

---

# 📋 CAMBIOS IMPLEMENTADOS

## 1. Separación arquitectónica (CRÍTICO)

### Antes
```typescript
interface BusinessContext {
  industry: Classification
  subindustries: Classification[]
  capabilities: {}
  observedPatterns: []
  metadata: {}
}
```

Problema: Si signals=NULL, TODO se invalidaba.

### Después
```typescript
interface BusinessContext {
  businessClassification: {
    industry: Classification
    subindustries: Classification[]
  }
  
  websiteAnalysis: {
    capabilities: {}
    observedPatterns: []
    customerAcquisitionChannels: []
    businessModels: []
  } | null
  
  metadata: {
    classificationValid: boolean
    classificationCoverage: "FULL" | "PARTIAL" | "NONE"
    signalsAvailable: boolean
    analysisValid: boolean
    dataIntegrity: "VALID" | "PARTIAL" | "INVALID"
  }
}
```

**Beneficio:** Bodegas López ahora es PARTIAL, no DEAD.

---

## 2. Eliminación de confidence

### Antes
```json
{
  "value": "Wine/Beverages",
  "source": "rubro",
  "evidence": ["Bodega"],
  "rule": "...",
  "confidence": 100
}
```

Problema: Si TODA regla devuelve 100, confidence es decoración.

### Después
```json
{
  "value": "Wine/Beverages",
  "source": "rubro",
  "evidence": ["Bodega"],
  "rule": "..."
}
```

**Beneficio:** Trazabilidad ya está en source + evidence + rule.

---

## 3. Implementación de PatternStatus

### Antes
```json
{
  "code": "INVITATION_WITHOUT_MECHANISM",
  "description": "...",
  "signals": [],
  "confidence": 100
}
```

Problema: ¿Es verdad o es especulación?

### Después
```json
{
  "code": "INVITATION_WITHOUT_MECHANISM",
  "description": "...",
  "signals": [],
  "status": "UNVERIFIED",
  "missingEvidence": ["LINK_DESTINATION_CRAWL"]
}
```

Estados:
- **CONFIRMED:** Directamente de signals boolean (hasEcommerce=true)
- **UNVERIFIED:** Requiere crawling adicional (seguir links)
- **REJECTED:** Contradice evidencia

**Beneficio:** Auditoría clara de qué se puede afirmar vs qué requiere validación.

---

## 4. ClassificationCoverage

### Nuevo tipo
```typescript
type ClassificationCoverage = "FULL" | "PARTIAL" | "NONE"
```

**Ejemplos:**

```
Casa Vigil: FULL (industry + subindustries)
Bodegas López: PARTIAL (industry + subindustries, SIN website analysis)
Sin rubro + sin signals: NONE
```

**Beneficio:** Pipeline posterior sabe inmediatamente si clasificar o no.

---

# 🔍 CASOS AFECTADOS POR REFACTOR

## Casa Vigil (NO CAMBIO)
```
businessClassification:
  industry: Food & Beverage ✅
  subindustries: [Food Service, Tourism/Experiences, Retail]

websiteAnalysis:
  patterns: [INVITATION_WITHOUT_MECHANISM (UNVERIFIED), ...]

metadata:
  classificationValid: true
  classificationCoverage: FULL
  signalsAvailable: true
  analysisValid: true
  dataIntegrity: VALID
```

## Bodegas López (CAMBIO IMPORTANTE)

**Antes:**
```json
{
  "industry": null,
  "subindustries": [],
  "metadata": {
    "analysisValid": false,
    "dataIntegrity": "INVALID"
  }
}
```

**Después:**
```json
{
  "businessClassification": {
    "industry": {
      "value": "Food & Beverage",
      "source": "rubro",
      "evidence": ["Bodega de exportación"],
      "rule": "rubro CONTAINS bodega"
    },
    "subindustries": [
      {
        "value": "Wine/Beverages",
        "source": "rubro",
        "evidence": ["Bodega de exportación"],
        "rule": "rubro CONTAINS bodega|vino|viña"
      }
    ]
  },
  
  "websiteAnalysis": null,
  
  "metadata": {
    "classificationValid": true,
    "classificationCoverage": "PARTIAL",
    "signalsAvailable": false,
    "analysisValid": false,
    "dataIntegrity": "PARTIAL",
    "requiredActions": ["RECAPTURE_SIGNALS"]
  }
}
```

**Impacto:** Bodegas López NO es "DEAD" → puede usarse para B2B targeting u otros modelos.

---

# 📊 DATASET STAGE A: 20 CASOS

**Objetivo:** Romper reglas, encontrar edge cases, ANTES de testing masivo.

**Distribución:**
- 5 Bodegas (incluyendo Bodega sin signals, Boutique pequeña, con restaurante)
- 5 Restaurantes (Fusion, Casual, Delivery, Fine Dining, Popup)
- 5 Retail (Moda, Electro, Libros, Artesanía, Premium)
- 5 Servicios (Consultoría, Marketing, Abogacia, Fitness, Contabilidad)

**Ubicación:** `src/business-context-engine/test-data-20.ts`

**Edge cases incluidos:**
- ❌ Bodega sin signals
- ⚠️ Restaurante casual con WhatsApp (no detectable)
- ⚠️ Botiga sin HTTPS
- ⚠️ Ecommerce sin Meta Pixel (múltiples casos)
- ⚠️ Servicio de agendar llamada (OnlineBooking ambiguo)

---

# 📈 PLAN DE TESTING

## STAGE A (ESTA SEMANA)
**20 casos → Objetivo: Romper reglas**

```
Ejecución:
  1. Correr engine sobre 20 casos
  2. Revisar outputs manualmente
  3. Capturar:
     - Falsos positivos
     - Falsos negativos
     - Edge cases
     - Crashes

Métricas esperadas:
  - 100% ejecutable (sin crashes)
  - 100% trazable
  - Identificar 10-20 casos problemáticos

Status: TBD (en curso)
```

## STAGE B (LA PRÓXIMA SEMANA)
**50 casos → Objetivo: Medir precisión**

```
Basado en:
  - 20 casos Stage A
  - 30 casos nuevos reales de Mendoza

Ejecución:
  1. Auditoría manual: muestra de 10/50 casos
  2. Calcular:
     - Precision = TP / (TP + FP)
     - Recall = TP / (TP + FN)
     - F1 score

Métricas objetivo:
  - Precision ≥ 90%
  - Recall ≥ 85%
  - F1 score ≥ 87%

Status: PENDING
```

## STAGE C (SEMANA 3)
**100 casos → Objetivo: Validación pre-producción**

```
Objetivo:
  - Reproducibilidad del modelo
  - Robustez sobre volumen
  - Listo para integración con Claude

Métricas objetivo:
  - Precision ≥ 95%
  - Recall ≥ 90%
  - F1 score ≥ 92%

Status: PENDING
```

---

# ✅ APROBACIÓN

**Estado del usuario:**
```
✅ APROBADO PARA REFACTOR ← DONE
✅ APROBADO PARA TESTING 20 CASOS ← NEXT
✅ APROBADO PARA TESTING 50 CASOS ← DESPUÉS
```

**NO APROBADO (hasta validar Stage A):**
```
❌ PRODUCCIÓN
❌ SCORING
❌ CLAUDE
❌ LEAD RANKING
```

---

# 📁 ARCHIVOS MODIFICADOS/CREADOS

| Archivo | Cambio | Status |
|---------|--------|--------|
| `types.ts` | Separación, eliminación confidence | ✅ DONE |
| `business-context-engine.service.ts` | Lógica PARTIAL/FULL | ✅ DONE |
| `business-context.validator.ts` | Validación UNVERIFIED | 🔄 PENDING UPDATE |
| `test-data-20.ts` | 20 casos STAGE A | ✅ DONE |
| `REFACTOR_APROBADO.md` | Este documento | ✅ DONE |

---

# 🎯 PRÓXIMO PASO

Ejecutar Stage A:

```bash
npm run test:stage-a
```

Generar auditoría manual sobre 5 casos específicos:
- Bodegas López (PARTIAL classification)
- Restaurante Casual (WhatsApp edge case)
- Bodega Boutique (HTTPS edge case)
- Retail Electro (sin Meta Pixel)
- Servicio Agencia (OnlineBooking ambiguo)

Resultado esperado: Documento de HALLAZGOS_STAGE_A.md

