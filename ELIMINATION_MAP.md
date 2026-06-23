# OpportunityEngine - Plan de Eliminación Completa

## 1. ARCHIVOS RELACIONADOS CON OpportunityEngine

### ARCHIVOS A ELIMINAR (100%)
```
apps/api/src/modules/enrichment/opportunity-engine.service.ts
  - Clase: OpportunityEngineService
  - Responsabilidad: Cargar catálogo + evaluar servicios
  - Dependencias: SERVICES_CATALOG_MACHINE.json
  - Usado por: EnrichmentService
  ❌ ELIMINAR COMPLETAMENTE

apps/api/src/modules/enrichment/opportunity-engine.spec.ts
  - Tests unitarios para OpportunityEngine
  ❌ ELIMINAR COMPLETAMENTE

apps/api/src/modules/enrichment/SERVICES_CATALOG_MACHINE.json
  - Catálogo de servicios con reglas determinísticas
  - 10 servicios (ecommerce, booking, crm, etc.)
  - Usado por: OpportunityEngineService
  ❌ ELIMINAR COMPLETAMENTE

src/opportunity-engine/
  - Carpeta: tests y tooling de OpportunityEngine
  ❌ ELIMINAR COMPLETAMENTE (si existe)
```

### ARCHIVOS A MODIFICAR (Referencias a OpportunityEngine)

```
apps/api/src/modules/enrichment/enrichment.module.ts
  - Línea: Imports de OpportunityEngineService
  - Línea: providers: [OpportunityEngineService]
  - Línea: exports: [OpportunityEngineService]
  ⚠️ REEMPLAZAR: Remover OpportunityEngineService, agregar EnrichmentEvaluatorService

apps/api/src/modules/enrichment/enrichment.service.ts
  - Línea 11: import OpportunityEngineService
  - Línea 21: constructor parameter
  - Línea 164-183: Fase B (TODA la sección de OpportunityEngine.detect())
  - Línea 173: const activatedCount = opportunities.filter(o => o.activated).length
  - Línea 175: opportunityScore = Math.min(100, activatedCount * 25)
  - Línea 189: opportunities: oppsJson ← guardado en BD
  - Línea 208: summary usando opportunities.length
  - Línea 222: idem update query
  ⚠️ REEMPLAZAR: 
    - Remover import
    - Remover constructor param
    - Reemplazar Fase B con llamada a EnrichmentEvaluatorService
    - Cambiar cálculo de opportunityScore (dejar que Claude lo calcule)

apps/api/src/modules/enrichment/enrichment.controller.ts
  ✅ MANTENER: Sin cambios (solo expone endpoints de enrichmentService)

apps/api/src/modules/prospect-validation/prospect-validation.service.ts
  - Revisar si usa opportunityScore
  ⚠️ POSIBLE: Remover lógica basada en activatedCount

apps/api/src/modules/proposals/proposals.service.ts
  - Revisar si usa opportunityScore o opportunities
  ⚠️ POSIBLE: Ajustar si hay dependencias

apps/api/src/modules/research/research.controller.ts
  - Revisar si expone opportunityScore
  ⚠️ REVISAR: Puede no usar OpportunityEngine directamente

apps/api/src/modules/service-intelligence/catalog/scoring.ts
  - Revisar si hace referencia a OpportunityEngine scoring
  ⚠️ REVISAR: Puede ser parte de SIR (Service Intelligence Registry)

apps/api/src/modules/service-intelligence/catalog/pipeline-demo.ts
apps/api/src/modules/service-intelligence/catalog/sir-validate.ts
  - Demos o validaciones de catálogo
  ⚠️ POSIBLE: Limpiar referencias a SERVICES_CATALOG_MACHINE
```

### ARCHIVOS EN FRONTEND (UI)

```
src/erp/ERPPrototype.tsx
  - Línea 2330: if (enrichmentResult && enrichmentResult.opportunities && ...)
  - Línea 2346: enrichmentResult.opportunities.map((opp, i) => { ... })
  - Línea 2247-2255: Renderiza opportunityScore (progress bar)
  - Línea 3897: p.opportunityScore calculado desde agentScore
  - Línea 4739-4741: Muestra "Opp {opportunityScore}"
  - Línea 4958-4965: Score display final
  ⚠️ REEMPLAZAR:
    - Mantener UI para opportunities (pero cambiar source)
    - Mantener opportunityScore (será calculado por Claude en EnrichmentEvaluator)
    - Actualizar labels/descriptions si es necesario
```

### BASE DE DATOS

```
Schema: enrichment_results
  - opportunities: JSON (objeto array)
  - opportunityScore: integer
  - signals: JSON
  - summary: varchar
  ⚠️ MANTENER: Los campos siguen siendo útiles para EnrichmentEvaluator
    (solo cambia cómo se populan)

Schema: prospect
  - No hay cambios (no guarda opportunities directamente)
  ✅ MANTENER: Sin cambios
```

---

## 2. TABLA DE ACCIONES POR ARCHIVO

| Archivo | Acción | Razón | Prioridad |
|---------|--------|-------|-----------|
| opportunity-engine.service.ts | ❌ ELIMINAR | Reemplazado por Claude | ALTA |
| opportunity-engine.spec.ts | ❌ ELIMINAR | Tests de módulo eliminado | MEDIA |
| SERVICES_CATALOG_MACHINE.json | ❌ ELIMINAR | Catálogo determinístico no necesario | ALTA |
| enrichment.module.ts | ⚠️ REEMPLAZAR | Remover OpportunityEngineService import/provider | ALTA |
| enrichment.service.ts | ⚠️ REEMPLAZAR | Reemplazar Fase B completa | ALTA |
| ERPPrototype.tsx | ⚠️ REEMPLAZAR | Actualizar fuente de opportunities | ALTA |
| prospect-validation.service.ts | ⚠️ REVISAR | Verificar si usa activatedCount | MEDIA |
| proposals.service.ts | ⚠️ REVISAR | Verificar si usa opportunityScore | MEDIA |
| research.controller.ts | ⚠️ REVISAR | Verificar referencias | BAJA |
| service-intelligence/* | ⚠️ REVISAR | Verificar si es parte de SIR o legacy | BAJA |

---

## 3. CAMBIOS DE DATOS (enrichmentResult)

### Antes (OpportunityEngine)
```json
{
  "opportunities": [
    {
      "serviceId": "crm-automation",
      "name": "CRM + Automatización",
      "tier": 1,
      "activated": true,
      "evidence": [...]
    }
  ],
  "opportunityScore": 25,  ← Calculado por: Math.min(100, activatedCount * 25)
  "summary": "Detected 1 opportunities (1 activated)"
}
```

### Después (Claude EnrichmentEvaluator)
```json
{
  "opportunities": [
    {
      "serviceId": "crm-automation",
      "name": "CRM + Automatización",
      "recommendedAction": "IMPLEMENT",
      "estimatedTicket": 2500,
      "reasoning": "Lead capture gaps detected..."
    }
  ],
  "opportunityScore": 65,  ← Calculado por: Claude (razonamiento comercial)
  "proposalOutline": "...",
  "summary": "3 oportunidades detectadas"
}
```

---

## 4. SECUENCIA DE ELIMINACIÓN (Propuesta)

### Paso 1: Preparación
- [ ] Crear branch `refactor/remove-opportunity-engine`
- [ ] Crear archivo `EnrichmentEvaluatorService` (stub)
- [ ] Documentar este ELIMINATION_MAP.md en el repo

### Paso 2: Reemplazar imports
- [ ] enrichment.module.ts: Remover OpportunityEngineService, agregar EnrichmentEvaluatorService
- [ ] enrichment.service.ts: Remover import OpportunityEngine, agregar import EnrichmentEvaluator

### Paso 3: Reescribir Fase B
- [ ] enrichment.service.ts: Reemplazar líneas 164-183 (OpportunityEngine.detect) 
  con llamada a: this.enrichmentEvaluator.evaluate(signals, prospect)

### Paso 4: Remover código muerto
- [ ] Eliminar opportunity-engine.service.ts
- [ ] Eliminar opportunity-engine.spec.ts
- [ ] Eliminar SERVICES_CATALOG_MACHINE.json (copiar a dist previamente para no romper build)
- [ ] Limpiar package.json.copy:assets si es necesario

### Paso 5: Actualizar UI
- [ ] ERPPrototype.tsx: Actualizar estructura de opportunities según Claude output
- [ ] Actualizar labels si es necesario

### Paso 6: Validar
- [ ] npm run build
- [ ] Ejecutar tests (npm run test)
- [ ] Verificar que enrichment jobs corran sin errores
- [ ] Verificar que UI renderice opportunities correctamente

### Paso 7: Cleanup
- [ ] Revisar prospect-validation.service.ts por referencias
- [ ] Revisar proposals.service.ts por referencias
- [ ] Buscar imports muertos: `grep -r "opportunity-engine" apps/api/src`
- [ ] Buscar referencias a SERVICES_CATALOG: `grep -r "SERVICES_CATALOG" apps/`

---

## 5. RIESGO ASSESSMENT

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| enrichmentResult schema incompatible | ALTA | Claude output debe tener estructura compatible |
| UI queda rota | ALTA | Probar UI antes de hacer push |
| Datos históricos inconsistentes | MEDIA | enrichmentResult viejo vs nuevo format es compatible |
| Build falla por missing JSON | MEDIA | Verificar copy:assets script |
| Referencias huérfanas a OpportunityEngine | MEDIA | Grep exhaustivo antes de merge |

---

## ESTADO ACTUAL: ⏳ PENDIENTE APROBACIÓN

✅ Mapeo completado
⏳ Esperando aprobación para proceder con eliminación
