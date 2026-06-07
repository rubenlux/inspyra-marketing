# 07 — Reglas de Agentes IA

---

## Regla universal (invariante absoluta)

**Ningún agente IA puede:**
- Aprobar su propio output
- Validar evaluaciones propias
- Tomar decisiones finales que impacten a prospectos reales
- Cambiar estados que requieren aprobación humana
- Acceder directamente a la base de datos

**Siempre existe una etapa de aprobación humana entre el output del agente y el efecto en el sistema.**

---

## Arquitectura de ejecución

Todos los agentes se ejecutan como subprocesos del CLI de Claude:

```typescript
spawn('claude', ['-p', prompt, '--model', modelId, '--max-turns', '1'])
```

El proceso hijo escribe JSON a stdout. El servicio parsea el JSON y persiste via Prisma. El modelo se elige por balance costo/capacidad según la tarea.

---

## Research Agent

**Módulo:** `research`  
**Spec:** `spec-driven/02-erp-001-comercial-prospectos.md`

**Responsabilidad:** Investigar prospectos descubiertos y asignar un score inicial.

**Puede:**
- Crear registros de `ResearchJob`
- Actualizar campos del `Prospect` (score, oportunidadDetectada, problemasEncontrados, nivelOportunidad)
- Cambiar estado de `NUEVO` a `INVESTIGADO`

**No puede:**
- Cambiar estado más allá de `INVESTIGADO`
- Crear validaciones
- Aprobar prospectos

**Output:** Score 0–100 + análisis de oportunidad + problemas detectados.

---

## Opportunity Agent

**Módulo:** `prospect-validation`  
**Spec:** `spec-driven/25-erp-024-politica-intelligence.md`

**Responsabilidad:** Evaluar la calidad comercial del prospecto y producir un score de oportunidad estructurado.

**Puede:**
- Crear/actualizar `ProspectValidation` con `status = PENDING`
- Asignar `agentScore`, `prioridad`, `servicesRecommended`, `estimatedTicketUsd`
- Producir `decisionFactors` con desglose de score

**No puede:**
- Cambiar `status` a `VALIDATED` (eso requiere acción humana)
- Cambiar el estado del `Prospect`
- Acceder a datos de otros tenants

**Output que el humano revisa:** Score, razonamiento, servicios recomendados, ticket estimado.

**Nota:** El Research Score y el Opportunity Score son distintos. El agentScore del Opportunity Agent es el que importa para el pipeline.

---

## Enrichment Agent

**Módulo:** `enrichment`  
**Spec:** ERP correspondiente

**Responsabilidad:** Ampliar el perfil del prospecto con datos de contacto, presencia digital y scoring de contactabilidad.

**Prerequisito:** `ProspectValidation.status = VALIDATED` (humano aprobó).

**Puede:**
- Crear/actualizar `EnrichmentResult`
- Actualizar campos del `Prospect` (contacto, digital footprint, communicationLanguage)
- Crear `EnrichmentJob`

**No puede:**
- Cambiar estado del `Prospect` a `LISTO_PROPUESTA` (eso requiere aprobación humana del enrichment)
- Aprobar su propio enrichment

**Output que el humano revisa:** Datos enriquecidos, contactabilityScore, communicationLanguage detectado.

---

## Proposal Agent

**Módulo:** `proposals`  
**Spec:** `spec-driven/28-erp-026-proposal-engine.md`

**Responsabilidad:** Generar textos de Outreach Brief y Commercial Proposal adaptados al prospecto y su mercado.

**Prerequisito:** Enrichment aprobado por humano + `estado = LISTO_PROPUESTA` o superior.

**Puede:**
- Crear `Proposal` con `status = DRAFT`
- Generar `ProposalType.OUTREACH` y `ProposalType.COMMERCIAL`
- Regenerar versiones (linkadas via `parentProposalId`)
- Usar `communicationLanguage` del prospecto para determinar idioma

**No puede:**
- Cambiar `status` a `APPROVED` (eso requiere acción humana)
- Cambiar estado del `Prospect`
- Inventar precios fuera del catálogo configurado

**Output que el humano revisa:** Texto de outreach/propuesta en el idioma del prospecto.

**Traducción:** El endpoint `POST /proposals/translate` permite al operador ver la propuesta en español. La traducción es una vista auxiliar — no se persiste, no reemplaza el original.

---

## Outreach Agent (futuro)

**Estado:** No implementado. Diseño en progreso.

**Responsabilidad planificada:** Sugerir el mejor momento y canal para contactar, redactar variantes del mensaje, personalizar según respuesta previa.

**Restricción que ya se conoce:** No podrá enviar mensajes automáticamente sin confirmación humana. El primer envío siempre es manual.

---

## Tabla resumen de capacidades

| | Research | Opportunity | Enrichment | Proposal |
|---|---|---|---|---|
| Crear prospecto | ✗ | ✗ | ✗ | ✗ |
| Actualizar prospecto | ✓ (limitado) | ✗ | ✓ (limitado) | ✗ |
| Cambiar estado prospecto | Solo NUEVO→INVESTIGADO | ✗ | ✗ | ✗ |
| Aprobar su propio output | ✗ | ✗ | ✗ | ✗ |
| Crear validación | ✗ | ✓ (PENDING) | ✗ | ✗ |
| Validar (VALIDATED) | ✗ | ✗ | ✗ | ✗ |
| Crear propuesta | ✗ | ✗ | ✗ | ✓ (DRAFT) |
| Aprobar propuesta | ✗ | ✗ | ✗ | ✗ |
| Acceso DB directo | ✗ | ✗ | ✗ | ✗ |
