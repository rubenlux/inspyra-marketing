# Reporte de Validación: Business Opportunity Engine

**Fecha:** 2026-06-22  
**Componentes validados:** 
- `business-opportunity.prompt.ts`
- `analyzeBusinessOpportunity()` en ResearchService
- Endpoint `POST /research/business-opportunity`

---

## ✅ VALIDACIÓN DE ARQUITECTURA

### Separación Clara: Website Audit vs Business Opportunity

| Aspecto | Website Audit | Business Opportunity |
|---------|---------------|---------------------|
| Input | HTML, Headers, DOM | Contexto de negocio |
| Output | 5 capas técnicas | Oportunidades comerciales |
| Objetivo | Diagnosticar problemas técnicos | Identificar canales de dinero |
| Propósito | Propuestas detalladas | Decisión de outreach |

✓ **Validación:** Completamente separados. No hay mezcla conceptual.

---

## ✅ VALIDACIÓN DE PROMPT

### 1. Claridad de Objetivo (Línea 10-12)

```
"Tu objetivo NO es realizar una auditoría técnica.
Tu objetivo es responder: ¿Cómo gana dinero esta empresa? ¿Qué canales de ingresos está desaprovechando?"
```

✓ **Validación:** El prompt establece explícitamente que NO es técnico. Esto previene que caiga en análisis de SEO/Performance.

---

### 2. Estructura PASO-A-PASO

**PASO 1:** Identificar modelo de negocio (línea 29-45)
- Input: rubro, contexto
- Output: businessModel array (máx 2-3)
- ✓ Correcto: pregunta "¿CÓMO GENERA INGRESOS?"

**PASO 2:** Identificar oportunidades de ingresos (línea 47-64)
- Input: modelo detectado
- Output: gaps de negocio (sin analizar técnica)
- ✓ Correcto: lista gaps de dinero, no problemas de código

**PASO 3:** Mapear a servicios (línea 66-109)
- Input: opportunities detectadas
- Output: topServices ordenados por TIER
- ✓ Correcto: TIER 1-4 jerarquizado

---

### 3. Jerarquización Explícita (Línea 86-109)

```
TIER 1 — INGRESOS DIRECTOS:
  - Ecommerce Setup
  - Sistema de Reservas Online
  - Setup CRM
  - Email Marketing y Automatización

TIER 2 — CAPTURA:
  - Captura de Leads
  - Landing Page
  - Web Nuevo/Rediseño
  - WhatsApp Business

TIER 3 — VISIBILIDAD:
  - GBP
  - SEO Local
  - Meta Ads

TIER 4 — OPTIMIZACIÓN:
  - Redes Sociales
  - SEO Técnico
  - SEO Schema
  - HostingGuard
```

✓ **Validación:** SEO aparece SOLO en TIER 3-4. Ingresos directos en TIER 1.

---

### 4. Reglas Críticas (Línea 111-118)

```
1. SEO NUNCA ocupará más de UNA oportunidad en el top 3.
2. SEO NUNCA es la oportunidad principal si existe una ingresos directa.
3. Si no vende online → Ecommerce es #1.
4. Si no capta leads → Captura de Leads es #1.
5. Si no automatiza → CRM es #1.
6. NO mezcles SEO con ingresos directos.
```

✓ **Validación:** Reglas explícitas, numeradas, impiden regresiones.

---

### 5. Ejemplos (Línea 120-134)

**Ejemplo CORRECTO:**
```json
"topServices": ["Ecommerce Setup", "Captura de Leads", "SEO Local"]
```
- #1: Ecommerce (TIER 1)
- #2: Leads (TIER 2)
- #3: SEO (TIER 3)

✓ **Validación:** SEO está #3, no #1. Respeta jerarquía.

**Ejemplo INCORRECTO:**
```json
"topServices": ["SEO Técnico", "SEO Local", "SEO Schema", "Ecommerce Setup"]
```

✓ **Validación:** Explícitamente señala anti-patrón (SEO dominante).

---

### 6. Output JSON (Línea 138-156)

```json
{
  "businessModel": ["modelo1", "modelo2"],
  "revenueOpportunities": ["oportunidad1", "oportunidad2"],
  "topServices": ["servicio1", "servicio2", "servicio3", "servicio4"],
  "estimatedTicket": 0,
  "reasoning": "explicación breve",
  "summary": "párrafo ejecutivo"
}
```

✓ **Validación:**
- Campos explícitos
- Tipos definidos
- topServices limitado a 4 (no infinito)
- reasoning y summary son textuales (vendibles)

---

## ✅ VALIDACIÓN DE CÓDIGO

### Método: analyzeBusinessOpportunity()

```typescript
async analyzeBusinessOpportunity(
  empresa: string,
  rubro: string,
  website: string,
  googleMapsData?: Record<string, any>,
  websiteAudit?: Record<string, any>,
  contactData?: Record<string, any>,
): Promise<BusinessOpportunityResult>
```

✓ **Validación:**
- Firmas correctas
- Parámetros opcionales (googleMapsData, websiteAudit, contactData) — permite flexibilidad
- Retorna BusinessOpportunityResult (interfaz definida)

---

### Endpoint: POST /research/business-opportunity

```typescript
@Post('business-opportunity')
analyzeBusinessOpportunity(
  @Body() body: {
    empresa: string;
    rubro: string;
    website: string;
    googleMapsData?: Record<string, any>;
    websiteAudit?: Record<string, any>;
    contactData?: Record<string, any>;
  },
  @CurrentUser() _user: JwtPayload,
)
```

✓ **Validación:**
- POST (cálculo intensivo)
- Auth requerida (JwtPayload)
- Body schema claro
- Parámetros opcionales bien definidos

---

### Interface: BusinessOpportunityResult

```typescript
export interface BusinessOpportunityResult {
  businessModel: string[];
  revenueOpportunities: string[];
  topServices: string[];
  estimatedTicket: number;
  reasoning: string;
  summary: string;
}
```

✓ **Validación:**
- Tipos correctos
- Alineado con output JSON del prompt
- Sin campos técnicos (no `auditScore`, `hallazgos`, etc.)

---

## ✅ VALIDACIÓN DE COMPORTAMIENTO ESPERADO

### Caso 1: Bodega sin Ecommerce

**Input esperado:**
```json
{
  "empresa": "Bodegas Mendoza",
  "rubro": "Distribuidor de vinos",
  "website": "bodegas-mendoza.com.ar",
  "googleMapsData": { "rating": 4.8, "reviews": 120 }
}
```

**Output esperado (según prompt):**
```json
{
  "businessModel": ["Venta de productos", "Distribuidor"],
  "revenueOpportunities": [
    "No vende online",
    "No captura clientes de otras regiones",
    "No automatiza pedidos"
  ],
  "topServices": [
    "Ecommerce Setup",
    "Captura de Leads (Formulario + CRM)",
    "Setup CRM"
  ],
  "estimatedTicket": 140000,
  "reasoning": "Modelo distribución existente puede expandirse online. Captura de leads permite alcance geográfico. CRM automatiza proceso de venta.",
  "summary": "Expandir venta a nivel nacional sin abrir sucursales. Sistema de pedidos online + CRM = +400% volumen potencial."
}
```

**Validación checklist:**
- [ ] businessModel responde "¿cómo gana dinero?" (✓ venta productos)
- [ ] revenueOpportunities menciona INGRESOS, no técnica (✓ "no vende online")
- [ ] topServices: Ecommerce #1 (✓ TIER 1)
- [ ] topServices: Leads #2 (✓ TIER 2)
- [ ] topServices: CRM #3 (✓ TIER 1)
- [ ] SEO NO aparece en top 3 (✓)
- [ ] estimatedTicket es realista (✓ 140k para stack completo)
- [ ] reasoning habla de dinero/oportunidades (✓)
- [ ] summary es outreach-ready (✓)

**Riesgo de regresión:**
- ❌ Si sale: ["SEO Local", "Ecommerce", ...] → falla REGLA #2
- ❌ Si sale: ["SEO Schema", "SEO Local", "SEO Técnico", ...] → falla REGLA #1
- ❌ Si reasoning dice "meta tags obsoletos" → falla objetivo

---

### Caso 2: Restaurante sin Reservas

**Punto crítico:** Restaurante = Servicios = Alta demanda de reservas.

**Validación checklist:**
- [ ] businessModel: "Restaurante" o "Servicios de comida" (✓)
- [ ] revenueOpportunities: "No tiene reservas online" (✓ primera)
- [ ] topServices: "Sistema de Reservas Online" #1 (✓ TIER 1)
- [ ] topServices: NO "SEO Local" #1 (✗ si esto pasa = falla)

**Riesgo crítico:** El prompt podría confundir "baja visibilidad online" (técnico) con "no captura reservas" (comercial).

**Defensa:** Línea 113-114 "SEO NUNCA es principal si existe ingresos directa" + línea 126 ejemplo explícito.

---

### Caso 3: Consultora sin Web

**Punto crítico:** Sin web = prerequisito para todo. ¿Qué viene primero?

**Validación checklist:**
- [ ] businessModel: "Servicios" / "B2B" (✓)
- [ ] revenueOpportunities: "Sin presencia web" (✓)
- [ ] topServices: "Sitio Web Nuevo" #1 (✓ TIER 2, pero prerequisito)
- [ ] topServices: "Captura de Leads" #2 (✓ TIER 2)

**Riesgo:** ¿El prompt reconoce que web sin leads capture = desperdicios?

**Defensa:** Línea 97 "Sitio Web Nuevo / Rediseño Web" en TIER 2, seguido de "Captura de Leads" → implícitamente web + leads juntos.

---

## ⚠️ ÁREAS DE RIESGO Y MITIGACIÓN

### Riesgo 1: Claude "Halucina" Servicios

**Descripción:** Claude inventa servicios fuera del catálogo.

**Mitigación:**
- Línea 68: "CATÁLOGO (solo estos nombres exactos)"
- Línea 152: "topServices: máximo 4, del catálogo exacto"
- Output schema: array de strings exactos

**Nivel:** BAJO (prompt es muy explícito)

---

### Riesgo 2: SEO Domina Igual

**Descripción:** A pesar de reglas, Claude pone "SEO Local" #1 porque la empresa "es invisible".

**Mitigación:**
- Línea 113-114: Regla crítica #2
- Línea 120-126: Ejemplo bodega (no SEO #1)
- Línea 128-134: Ejemplo incorrecto explícitamente marcado
- Línea 118: "NO mezcles SEO con ingresos directos"

**Nivel:** MEDIO (requiere validación en testing)

---

### Riesgo 3: estimatedTicket Genérico

**Descripción:** Ticket idéntico para bodega (140k) y consultora (140k).

**Mitigación:**
- Línea 153: "0-150000 (ARS estimado)"
- Reglas de TIER implícitamente sugieren ticket diferente
- No hay guardrail explícito en prompt

**Nivel:** MEDIO (verificar en testing)

---

### Riesgo 4: reasoning Técnico

**Descripción:** "Empresa necesita mejorar meta tags porque son obsoletos".

**Mitigación:**
- Línea 155: "reasoning: explicación breve de por qué estos servicios"
- Implícitamente debe hablar de servicios (comercial), no problemas técnicos
- No hay guardrail explícito

**Nivel:** MEDIO (verificar en testing)

---

## 📊 MATRIZ DE RIESGOS vs DEFENSAS

| Riesgo | Defensa | Nivel |
|--------|---------|-------|
| SEO domina igual | Regla #2 + Ejemplos + Catálogo TIER | MEDIO |
| Hallucina servicios | Catálogo explícito "exactos" | BAJO |
| Ticket genérico | Sin guardrail explícito | MEDIO |
| Reasoning técnico | Output esperado es comercial | MEDIO |
| Confunde visibilidad con ingresos | Definición clara en PASO 1-2 | BAJO |

---

## ✅ VALIDACIÓN FINAL

**Arquitectura:** ✓ Separación clara, sin mezcla conceptual  
**Prompt:** ✓ Bien estructurado, reglas explícitas, ejemplos  
**Código:** ✓ Implementación correcta, interfaz alineada  
**Guardrails:** ⚠️ MEDIO — requiere testing con Sonnet real

---

## 🚀 INSTRUCCIONES DE VALIDACIÓN EN VIVO

### Paso 1: Compilar y desplegar

```bash
cd apps/api
npm run build
npm run start:dev
```

### Paso 2: Registrar usuario y obtener token

```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"validator@test.com","password":"validpass123","name":"Validator"}'

curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"validator@test.com","password":"validpass123"}'
```

### Paso 3: Ejecutar 5 casos de test

```bash
TOKEN="<jwt_token>"

# Caso 1: Bodega
curl -X POST http://localhost:5000/research/business-opportunity \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "empresa": "Bodegas Mendoza",
    "rubro": "Distribuidor de vinos",
    "website": "bodegas-mendoza.com.ar",
    "googleMapsData": {"rating": 4.8, "reviews": 120}
  }' | jq '.topServices[0]'
# Esperado: "Ecommerce Setup" NO "SEO Local"
```

### Paso 4: Verificar matriz de validación

Ver `VALIDATION_BUSINESS_OPPORTUNITY.md` línea 60-90.

---

## 📝 CONCLUSIÓN

El **Business Opportunity Engine** está correctamente implementado con:

✓ Separación clara de Website Audit  
✓ Lógica comercial (no técnica)  
✓ TIER de priorización explícito  
✓ Reglas anti-SEO-dominante  
✓ Ejemplos de comportamiento esperado/incorrecto

**Recomendación:** Proceder con testing en vivo. Los riesgos identificados (SEO dominante, reasoning técnico) son mitigables con ajustes menores si se detectan en testing.
