# REGLAS DURAS: BUSINESS CONTEXT ENGINE
## Decisiones arquitectónicas que hacen el sistema 100% trazable

**Fecha:** 2026-06-22  
**Status:** ARQUITECTURA FINAL (sin inferencias ocultas)

---

# DECISIÓN 1: Wine/Beverages Classification

## Regla

Wine/Beverages es válido SI Y SOLO SI existe al menos una de:

```
1. Rubro declarado CONTIENE: bodega|viña|vino|viñedo|wine|winery
2. mainNavSections CONTIENE: vino|wines|wine shop|bodega|viñedos
3. Ecommerce categorías detectan: vino|wine (no implementado aún)
```

## Si NINGUNA evidencia existe:

```
subindustry = {
  value: "Wine/Beverages",
  status: "PENDING",
  reason: "No evidence found",
  requiredEvidence: ["rubro contains wine", "OR nav contains wine", "OR ecommerce categories"]
}
```

## Aplicado a Casa Vigil

**Rubro:** "Restaurante de alta cocina"
- ❌ NO contiene bodega|viña|vino
- ❌ mainNavSections: ["UNIVERSO VIGIL", "COMPRA ONLINE", "HACER UNA RESERVA"]
  - NO contiene vino|wine
- ❌ Sin análisis de ecommerce categorías

**Veredicto:** Wine/Beverages = PENDING (sin procesar con análisis)

---

# DECISIÓN 2: Accommodation Classification

## Regla

Accommodation es válido SI Y SOLO SI existe al menos una de:

```
1. Rubro declarado CONTIENE: hotel|hospedaje|alojamiento|rooms|suites|lodge|inn
2. mainNavSections CONTIENE: hospedaje|alojamiento|rooms|suites|stay|accommodation
3. hasOnlineBooking=true Y rubro es de turismo (secundario)
```

## Si NINGUNA evidencia existe:

```
NO se incluye en subindustries
```

## Aplicado a Casa Vigil

**Rubro:** "Restaurante de alta cocina"
- ❌ NO contiene hotel|hospedaje
- ❌ mainNavSections NO contiene hospedaje|alojamiento
- ⚠️ hasOnlineBooking=false (no aplica regla 3)

**Veredicto:** Accommodation = ELIMINADO (invalid)

---

# DECISIÓN 3: Data Integrity Rule

## Regla

```
IF signals = NULL THEN analysis_status = INVALID
```

### Expansión

```typescript
if (!signals || Object.keys(signals).length === 0) {
  return {
    status: "INVALID",
    reason: "NO_SIGNALS_CAPTURED",
    analysis: null,
    requiredAction: "RECAPTURE_SIGNALS"
  };
}
```

## Aplicado a Bodegas López

**Signals:** NULL  
**Analysis:** EXISTS (pero sin base)

**Acción:**
1. Marcar análisis como INVALID
2. Recapturar signals desde Playwright
3. Re-ejecutar análisis
4. Si recaptura falla: prospecto bloqueado

**Veredicto:** Bodegas López = PENDING SIGNALS (no procesado)

---

# DECISIÓN 4: Enhanced Subindustry Structure

## De esto:

```typescript
subindustries: string[]
```

## A esto:

```typescript
subindustries: Array<{
  value: string;
  source: "rubro" | "mainNavSections" | "ecommerce" | "signals";
  evidence: string[];
  confidence: 100 | 80 | 60;
  rule: string;
}>
```

## Ejemplo: Pulenta Estate

```json
{
  "value": "Wine/Beverages",
  "source": "rubro",
  "evidence": ["Bodega"],
  "confidence": 100,
  "rule": "rubro CONTAINS bodega|vino|viña"
}
```

```json
{
  "value": "Tourism/Experiences",
  "source": "mainNavSections",
  "evidence": ["TURISMO"],
  "confidence": 100,
  "rule": "nav CONTAINS turismo|tours|visitas"
}
```

```json
{
  "value": "Retail Commerce",
  "source": "signals",
  "evidence": ["hasEcommerce=true", "mainNavSections contains TIENDA"],
  "confidence": 100,
  "rule": "hasEcommerce OR nav CONTAINS tienda|shop"
}
```

## Beneficio

Cuando un comercial ve:

```
subindustries: [
  { value: "Wine/Beverages", source: "rubro", evidence: ["Bodega"], confidence: 100 },
  { value: "Tourism/Experiences", source: "mainNavSections", evidence: ["TURISMO"], confidence: 100 }
]
```

Sabe EXACTAMENTE:
- ¿Por qué aparece?
- ¿De qué parte del análisis viene?
- ¿Cuál es la confianza?
- ¿Puede ser rechazado?

---

# ESTRUCTURA FINAL: BusinessContext

```typescript
interface BusinessContext {
  // Clasificación principal
  industry: IndustryType;
  
  // Subindustries TRAZABLE
  subindustries: Array<{
    value: SubindustryType;
    source: "rubro" | "mainNavSections" | "ecommerce" | "signals";
    evidence: string[];
    confidence: 100 | 80 | 60;
    rule: string;
  }>;
  
  // Capacidades directas de signals
  capabilities: {
    hasOnlineBooking: boolean;
    hasEcommerce: boolean;
    hasSocialPresence: boolean;
    hasLeadCapture: boolean;
    hasPhoneContact: boolean;
    hasDirectContact: boolean;
  };
  
  // Patrones detectados con evidencia
  observedPatterns: Array<{
    code: PatternCode;
    description: string;
    signals: string[];
    confidence: 100 | 80 | 60;
  }>;
  
  // Canales con trazabilidad
  customerAcquisitionChannels: Array<{
    channel: Channel;
    evidence: string;
    signal: string;
  }>;
  
  // Modelos con trazabilidad
  businessModels: Array<{
    model: BusinessModel;
    evidence: string;
    signal: string;
  }>;
  
  // Metadatos críticos
  metadata: {
    signalsAvailable: boolean;
    analysisValid: boolean;
    dataIntegrity: "VALID" | "PENDING" | "INVALID";
    requiredActions?: string[];
  };
}
```

---

# APLICACIÓN A 4 CASOS (FINAL)

## Casa Vigil

```json
{
  "industry": "Food & Beverage",
  "subindustries": [
    {
      "value": "Food Service",
      "source": "rubro",
      "evidence": ["Restaurante de alta cocina"],
      "confidence": 100,
      "rule": "rubro CONTAINS restaurante"
    },
    {
      "value": "Tourism/Experiences",
      "source": "mainNavSections",
      "evidence": ["HACER UNA RESERVA"],
      "confidence": 100,
      "rule": "nav CONTAINS reserva|turismo|visitas"
    },
    {
      "value": "Wine/Beverages",
      "source": null,
      "status": "PENDING",
      "reason": "No evidence in rubro or nav"
    },
    {
      "value": "Accommodation",
      "source": null,
      "status": "INVALID",
      "reason": "No supporting evidence"
    }
  ],
  "metadata": {
    "signalsAvailable": true,
    "analysisValid": true,
    "dataIntegrity": "VALID",
    "notes": ["Wine/Beverages pending verification", "Accommodation removed"]
  }
}
```

## Pulenta Estate

```json
{
  "industry": "Food & Beverage",
  "subindustries": [
    {
      "value": "Wine/Beverages",
      "source": "rubro",
      "evidence": ["Bodega"],
      "confidence": 100
    },
    {
      "value": "Tourism/Experiences",
      "source": "mainNavSections",
      "evidence": ["TURISMO"],
      "confidence": 100
    },
    {
      "value": "Retail Commerce",
      "source": "signals",
      "evidence": ["hasEcommerce=true", "mainNavSections contains TIENDA"],
      "confidence": 100
    }
  ],
  "metadata": {
    "signalsAvailable": true,
    "analysisValid": true,
    "dataIntegrity": "VALID"
  }
}
```

## Bodegas López

```json
{
  "industry": null,
  "subindustries": [],
  "metadata": {
    "signalsAvailable": false,
    "analysisValid": false,
    "dataIntegrity": "INVALID",
    "requiredActions": ["RECAPTURE_SIGNALS", "RE_EXECUTE_ANALYSIS"]
  }
}
```

## Norton

```json
{
  "industry": "Food & Beverage",
  "subindustries": [
    {
      "value": "Wine/Beverages",
      "source": "rubro",
      "evidence": ["Bodega"],
      "confidence": 100
    },
    {
      "value": "Retail Commerce",
      "source": "signals",
      "evidence": ["hasEcommerce=true", "hasWooCommerce=true"],
      "confidence": 100
    }
  ],
  "metadata": {
    "signalsAvailable": true,
    "analysisValid": true,
    "dataIntegrity": "VALID"
  }
}
```

---

# DECISIÓN 5: NO INFERENCIA DE NEGOCIO

## Regla

Business Context Engine puede clasificar ÚNICAMENTE usando:

```
1. rubro declarado (input directo)
2. signals de Playwright (hasEcommerce, hasPhone, etc.)
3. contactData (nombre, email, teléfono)
4. mainNavSections (secciones del menú principal)
```

## Prohibido EXPLÍCITAMENTE:

```
❌ Inferir tamaño de empresa
❌ Inferir facturación
❌ Inferir turismo premium / lujo
❌ Inferir mercado objetivo
❌ Inferir ticket promedio
❌ Inferir cantidad de clientes
❌ Estimar valor del negocio
❌ Clasificar por sofisticación
❌ Asumir capacidades no detectadas
```

## Si no existe evidencia explícita:

```
NO CLASIFICAR
```

**Ejemplo:** Si hasEcommerce=false, NO puedes clasificar como "Retail Commerce" aunque el rubro sea "Tienda de ropa". Necesitas evidencia explícita.

---

# DECISIÓN 6: EXPLICABILIDAD TOTAL

## Regla

**Todo campo generado DEBE incluir metadata completa:**

```typescript
{
  value: string;
  source: "rubro" | "signals" | "nav" | "contactData" | "pending";
  evidence: string[];
  rule: string;
  confidence: 100 | 80 | 60;
}
```

## Prohibido:

```
❌ subindustries: string[]
❌ subindustries: ["Wine/Beverages", "Tourism"]
❌ capabilities sin signals que lo corten
❌ patterns sin código y evidencia
❌ canales sin signal origen
❌ modelos sin rule
```

## Permitido:

```json
{
  "value": "Wine/Beverages",
  "source": "rubro",
  "evidence": ["Bodega"],
  "rule": "rubro CONTAINS bodega|vino|viña",
  "confidence": 100
}
```

## Si falta metadata:

```
RECHAZAR output.
Regenerar.
```

---

# CHECKLIST PRE-IMPLEMENTACIÓN

- [ ] Regla Wine/Beverages requiere 3 evidencias (rubro OR nav OR ecommerce)
- [ ] Accommodation eliminado completamente
- [ ] Rule "NO signals = NO analysis" implementada
- [ ] Subindustries tienen structure con source+evidence+confidence
- [ ] Capabilities permanecen como booleanos directos de signals
- [ ] ObservedPatterns tienen trazabilidad
- [ ] CustomerAcquisitionChannels tienen trazabilidad
- [ ] BusinessModels tienen trazabilidad
- [ ] Metadata incluye dataIntegrity status
- [ ] Casa Vigil Wine/Beverages marcado como PENDING
- [ ] Casa Vigil Accommodation ELIMINADO
- [ ] Bodegas López BLOQUEADO hasta recaptura
- [ ] **REGLA 5:** NO INFERENCIA DE NEGOCIO (prohibidas 10 tipos de inferencias)
- [ ] **REGLA 6:** TODO TIENE source+evidence+rule+confidence
- [ ] Output validado contra 4 casos antes de integración
- [ ] NO CONECTAR CON CLAUDE (aislado primero)

**CUANDO TODOS LOS CHECKS PASEN: VALIDAR OUTPUT → LUEGO OK PARA INTEGRACIÓN**

