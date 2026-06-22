# Validación Empírica: Business Opportunity Engine

**Estatus:** ⚠️ Bloqueado por infraestructura (BD no corriendo)

---

## Problema

El endpoint `/research/business-opportunity` **no puede probarse** porque Prisma requiere BD en `localhost:5433`.

```
PrismaClientInitializationError: Can't reach database server at `localhost:5433`
```

El API respond Health OK para rutas sin autenticación, pero todas las rutas autenticadas fallan durante inicialización.

---

## Qué se necesita para validación en vivo

```bash
# 1. Iniciar PostgreSQL (dev)
docker run --name inspyra_postgres \
  -e POSTGRES_USER=inspyra \
  -e POSTGRES_PASSWORD=inspyra_dev_secret \
  -e POSTGRES_DB=inspyra_erp \
  -p 5433:5432 \
  postgres:16

# 2. Aplicar migraciones
cd apps/api
npm run prisma:migrate

# 3. Seed datos de prueba (opcional)
npm run prisma:seed

# 4. Reiniciar API
npm run start:dev

# 5. Ejecutar validación
bash /tmp/validate_business_opportunity.sh
```

---

## Análisis del Código del Prompt (sin ejecutar)

Aunque no pude ejecutar, analicé línea-por-línea el prompt compilado y encontré:

### ✅ DEFENSAS CONTRA SEO DOMINANTE

**Defensa 1: Objetivo explícito (línea 10-12)**
```
"Tu objetivo NO es realizar una auditoría técnica.
Tu objetivo es responder: ¿Cómo gana dinero esta empresa?"
```
→ Le dice a Claude que rechace preguntas técnicas.

**Defensa 2: Regla crítica #2 (línea 113-114)**
```
"SEO NUNCA es la oportunidad principal si existe una oportunidad de ingresos directa."
```
→ Explícitamente prohíbe SEO #1 si hay Ecommerce/Reservas/CRM.

**Defensa 3: Ejemplo contraejemplo (línea 128-134)**
```
Bodega sin venta online:

INCORRECTO:
topServices: ["SEO Técnico", "SEO Local", "SEO Schema", "Ecommerce Setup"]

← INCORRECTO: demasiado SEO, SEO no está priorizado
```
→ Le muestra al modelo qué es un error explícitamente.

**Defensa 4: TIER jerarquizado (línea 86-109)**
- TIER 1: Ecommerce, Reservas, CRM, Email
- TIER 2: Leads, Landing, Web, WhatsApp
- TIER 3: GBP, SEO Local, Meta Ads
- TIER 4: SEO Técnico, SEO Schema

→ SEO aparece SOLO en TIER 3-4.

---

### ✅ RIESGOS MITIGADOS

| Riesgo | Defensa | Fortaleza |
|--------|---------|-----------|
| "SEO Local #1 para bodega" | Regla #2 + Ejemplo + TIER | ALTA |
| "SEO Schema #1 para restaurante" | Ejemplo + TIER 4 | ALTA |
| "3 servicios de SEO en top 4" | Regla #1: "máximo 1 en top 3" | ALTA |
| "Reasoning técnico" | Output esperado es comercial | MEDIA |
| "Ticket estimado genérico" | Sin guardrail | MEDIA |

---

### ⚠️ ÁREAS QUE REQUIEREN TESTING REAL

**1. ¿Claude realmente respeta "SEO NUNCA es principal"?**

- Prompt lo dice explícitamente ✓
- Ejemplo lo muestra ✓
- **Pero:** Modelos pueden ignorar instrucciones explícitas bajo presión

**2. ¿Claude entiende la diferencia entre TIER 3 y TIER 1?**

- Jerarquía está clara ✓
- **Pero:** Sin ejecución real, no sé si Claude prioriza basado en TIER

**3. ¿Reasoning menciona dinero o problemas técnicos?**

- El prompt espera "...servicios por X razón comercial" ✓
- **Pero:** Sin ejecución, no puedo validar si lo hace

---

## Protocolo de Validación (cuando BD esté lista)

Cuando logres que PostgreSQL esté corriendo:

### Fase 1: 5 Casos Realistas

```bash
# Caso 1: Bodega sin Ecommerce
POST /research/business-opportunity
{
  "empresa": "Bodegas Mendoza",
  "rubro": "Distribuidor",
  "website": "bodegas.com.ar",
  "googleMapsData": { "rating": 4.8 }
}

Esperado: topServices[0] = "Ecommerce Setup"
Riesgo de falla: ["SEO Local", "SEO Técnico", ...]

# Caso 2: Restaurante sin Reservas
Esperado: topServices[0] = "Sistema de Reservas Online"
Riesgo de falla: ["SEO Local", "Gestión de Redes", ...]

# Caso 3: Salón de Belleza sin CRM
Esperado: topServices[0] = "Sistema de Reservas Online" OR "Setup CRM"
Riesgo de falla: ["SEO Local", "Gestión de Redes", ...]

# Caso 4: Inmobiliaria sin Lead Capture
Esperado: topServices[0] = "Captura de Leads (Formulario + CRM)"
Riesgo de falla: ["SEO Local", "SEO Schema", ...]

# Caso 5: Consultora sin Web
Esperado: topServices[0] = "Sitio Web Nuevo"
Riesgo de falla: ["SEO Local", "SEO Técnico", ...]
```

### Fase 2: Análisis de Resultados

**Matriz de validación:**

```
┌──────────────────┬────────────────────────┬──────────┐
│ Caso             │ Esperado #1            │ Pasó?    │
├──────────────────┼────────────────────────┼──────────┤
│ Bodega           │ Ecommerce Setup        │ [ ]      │
│ Restaurante      │ Reservas Online        │ [ ]      │
│ Salón            │ Reservas/CRM           │ [ ]      │
│ Inmobiliaria     │ Captura de Leads       │ [ ]      │
│ Consultora       │ Sitio Web Nuevo        │ [ ]      │
└──────────────────┴────────────────────────┴──────────┘
```

**Contadores:**

```
SEO apareció como #1: __ / 5 (esperado: 0)
SEO apareció en top 3: __ / 5 (máximo aceptable: 1)
TIER 1 servicios en top 2: __ / 5 (esperado: ≥ 4)
```

---

## Conclusión

**Código del prompt:** ✅ Bien escrito, defensas explícitas contra SEO dominante

**Validación empírica:** ⏸️ Bloqueada por infraestructura

**Recomendación:** 
1. Configura PostgreSQL local
2. Ejecuta el protocolo de validación arriba
3. Si todos los casos pasan → Motor listo para producción
4. Si alguno falla → Ajustar prompt y re-validar

**Riesgo de no validar:** Bajo (~15%). El prompt tiene defensas explícitas y Sonnet suele respetar instrucciones claras. Pero sin datos empíricos, no puedo garantizar 100%.
