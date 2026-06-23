# CLAUDE.md

## Proyecto

Inspyra ERP y ecosistema Inspyra deben seguir un enfoque spec-first.

## Project Brain (leer primero)

Leer `CLAUDE_PROJECT_CONTEXT.md` antes de cualquier tarea de implementación.
Memoria completa en `docs/project-brain/` (arquitectura, UI rules, estados, agentes, decisiones históricas).

## Invariantes críticos (siempre aplican — no hay excepciones)

Estos invariantes no necesitan verificación en spec ni en código. Son reglas absolutas:

**Frontend**
- `ERPPrototype.tsx` es el único frontend operativo. NO crear páginas nuevas, dashboards paralelos, routers ni layouts alternativos.
- Todo cambio de UI va dentro del `ProspectDrawer` existente y sus 4 tabs: assessment · contacto · propuesta · historial.
- NO duplicar KPIs, tabs, tablas, filtros ni drawers.

**Backend**
- Toda query de datos lleva `where: { tenantId }`. Sin excepción.
- Los estados de `ProspectEstado` solo cambian según `VALID_TRANSITIONS` en `prospects.service.ts`. NO parchear estados directamente.
- Extender módulos existentes antes de crear nuevos. Justificar explícitamente si se crea uno nuevo.

**Agentes IA**
- Ningún agente aprueba su propio output. Siempre `status: DRAFT` → revisión humana → `APPROVED`.
- `LISTO_OUTREACH` se alcanza solo aprobando una propuesta (`POST /proposals/:id/approve`), no via transición directa.
- El Opportunity Agent (`runAgent`) — ERP-052 — usa `problemasEncontrados` para scoring Service Match First. Si `problems.length === 0` → `ValidationStatus.DISCARDED` con `discardReason: INSUFFICIENT_DATA`. Si ningún problema mapea a un servicio INSPYRA → `DISCARDED` con `NO_SERVICE_MATCH`. NO es un error 400 — es un descarte legítimo.
- Prospectos `isLegacy = true` (creados antes de 2026-06-17) → `runAgent` lanza BadRequestException. Excluir de todas las queries con `where: { isLegacy: false }`.
- `PATCH /prospect-validations/:id/reactivate` revierte DISCARDED → PENDING. Solo acción humana, nunca automática.

**Google Maps Discovery (Migración Completada - Junio 2026)**
- Los prospectos importados desde Google Maps entran en estado `NUEVO`.
- **Motor de Búsqueda:** ✅ Operativo (Google Places API New). Empresas 100% reales.
- **Validación de Evidencia:** ✅ Operativo.
- **Promoción a Prospectos:** ✅ Fix aplicado para `currentProblems` (Prisma constraint).
- **problemasEncontrados** se puebla con los gaps detectados (Sin sitio web, Sin GBP, etc.) para habilitar el Opportunity Agent inmediatamente.


**Criterio de priorización**
> ¿Esta tarea acerca un prospecto a convertirse en cliente?

Si la respuesta es no, evaluar impacto operativo. Si tampoco, diferir.

## Checklist pre-implementación (ejecutar mentalmente antes de escribir código)

1. ¿Ya existe esto en `ERPPrototype.tsx`? → Verificar antes de crear
2. ¿Necesita página nueva? → La respuesta casi siempre es NO
3. ¿Hay `tenantId` en toda query de base de datos? → Obligatorio
4. ¿Respeta `VALID_TRANSITIONS`? → No asumir, verificar en `prospects.service.ts`
5. ¿La spec correspondiente fue leída en `spec-driven/`? → Leer antes de modificar el módulo
6. ¿Hay human approval en la acción del agente? → Los agentes no aprueban

## Spec Registry

La fuente de verdad del proyecto es:

- `specs/README.md`

Antes de generar codigo se deben revisar las specs relacionadas al dominio afectado.

## ERP-052 — Service Match First (vigente desde 2026-06-20)

Score = `matchFitScore(0-40) + impactScore(0-40) + contactScore(0-20)`, cap 100.
Score deriva del catálogo en `apps/api/src/modules/service-intelligence/catalog/problem-match.ts`.

**Reglas del catálogo:**
- Las reglas más específicas van primero. GBP antes que seo-local (evita que "no aparece en Google Maps" en contexto GBP sea robado por seo-local).
- SSL inválido/vencido → `hostingguard` EXACT_MATCH HIGH (no PARTIAL LOW).
- NO_SERVICE_MATCH no es un error — es un resultado válido de negocio.

**No modificar el catálogo sin:** (1) reporte de problemas sin match en datos reales, (2) análisis de familias canónicas, (3) verificación de falsos positivos.

## ERP Functional Specs

Las specs funcionales oficiales del ERP viven en:

- `spec-driven/`

Este directorio esta en la raiz del proyecto y contiene la constitucion del sistema y las specs `ERP-001` a `ERP-052` (en crecimiento).

Antes de implementar o modificar cualquier modulo ERP, Claude debe leer primero la spec correspondiente dentro de `spec-driven/` y respetar su alcance, modelo de datos, flujos, reglas de negocio y restricciones.

## Seguridad Obligatoria

Toda implementacion debe cumplir estas specs antes de considerarse lista para produccion:

- `specs/security/SEC-001-security-baseline.md` — como protegemos el sistema.
- `specs/security/SEC-002-security-testing.md` — como validamos que la proteccion funciona.

SEC-001 y SEC-002 viajan siempre juntas: ninguna implementacion se considera completa si define controles sin verificacion, o tests sin baseline de seguridad.

Estas specs aplican a frontend, backend, infraestructura, CI/CD, MCP servers, agentes IA, integraciones, billing, auth, uploads y datos de clientes.

## Development Standards

- `specs/standards/frontend-standards.mdc`
- `specs/standards/backend-standards.mdc`
- `specs/standards/testing-standards.mdc`
- `specs/standards/infra-standards.mdc`

## Reglas Para Cambios

- No introducir secretos en el frontend, repositorio, logs o fixtures.
- No agregar endpoints, acciones destructivas ni integraciones sin validacion de auth, permisos, ownership y rate limit.
- No exponer recursos internos, DB, Redis, metrics, docs u OpenAPI en produccion.
- Todo cambio de seguridad debe dejar evidencia verificable mediante test, checklist o documentacion.
- Respetar APIs existentes, tenant isolation, RBAC, naming conventions y estructura de carpetas.
- Actualizar documentacion si cambia comportamiento.

## INSPYRA Mail

Integración real con el servicio de correo corporativo de Inspyra (`api.inspyra.cloud`).

**Spec oficial:** `docs/inspyra-mail-spec.md` (auditada en producción, junio 2026).

**Modelo de autenticación (crítico):**

El ERP usa su propio JWT (`JWT_SECRET`) — NO es Cognito. Los endpoints privados de INSPYRA Mail requieren Cognito JWT, por lo tanto el ERP solo puede usar los endpoints `/v1/public/mail/*` que aceptan `Bearer MAIL_API_KEY`.

- Envío transaccional: `POST /v1/public/mail/send` — auth `Bearer MAIL_API_KEY`
- Lectura IMAP: `GET /v1/public/mail/messages?email=&folder=&limit=` — auth `Bearer MAIL_API_KEY` (endpoint público, habilitado en junio 2026)
- Carpetas IMAP: `GET /v1/public/mail/folders?email=` — auth `Bearer MAIL_API_KEY`
- Drafts API: `GET/POST /v1/public/mail/drafts`, `POST /v1/public/mail/drafts/:id/send`, `DELETE /v1/public/mail/drafts/:id` — auth `Bearer MAIL_API_KEY`
- `MAIL_API_BASE` se deriva de `MAIL_API_URL` en runtime vía `new URL(url).origin` — no hardcodear `api.inspyra.cloud`.
- Los mailboxes activos son `contacto@`, `soporte@` y `hola@inspyra.cloud`.

**Rutas NestJS proxy** (dentro del módulo `outreach`, ANTES de las rutas parametrizadas `:prospectId`):
- `GET /outreach/mail/folders`
- `GET /outreach/mail/messages`
- `GET /outreach/mail/messages/:uid`
- `POST /outreach/mail/send`
- `GET /outreach/mail/drafts`
- `POST /outreach/mail/drafts`
- `POST /outreach/mail/drafts/:draftId/send`
- `DELETE /outreach/mail/drafts/:draftId`

**Flujo de outreach inicial (ERP-036):**
1. Prospecto en `LISTO_OUTREACH` → botón "Contactar" → carga `_outreachDraft` → navega a InspyraMail
2. Usuario revisa/edita → "Enviar email"
3. El envío llama `POST /outreach/:id/send-email` → transición a `CONTACTADO` solo con entrega confirmada

**Flujo de follow-up (ERP-044A):**
1. OpenClaw crea draft via `POST /outreach/mail/drafts` con `externalRef: prospectId`
2. Draft aparece en InspyraMail → carpeta "Borradores" (muestra API drafts, no IMAP)
3. Usuario revisa → "Enviar borrador" → `POST /outreach/mail/drafts/:id/send` con `{ prospectId }`
4. Backend envía + registra actividad `FOLLOWUP_1/2/3` según historial del prospecto

**ERP-044B (bloqueado):** Requiere MAIL-002 — webhook `mail.reply_received` con `correlationId` desde INSPYRA Mail.

## Prioridad

En caso de conflicto:

1. Security specs
2. Backend / architecture specs
3. ERP module specs
4. Local implementation details

Security siempre tiene prioridad.

## Auditoría Post-Migración: Opportunity Engine (ERP-052) — Junio 2026

Tras la exitosa migración de Discovery a Google Maps, se realizó una auditoría forense del motor de oportunidades con datos reales (Bodegas Mendoza).

**Hallazgos Críticos:**
1.  **Bloqueador Externo:** El sistema falló al intentar evaluar candidatos debido a falta de saldo/tokens en la cuenta de Claude vía CLI (`You've hit your monthly spend limit`).
2.  **Integridad de Datos:** Se corrigió un error de persistencia donde `currentProblems` no se inicializaba al promocionar prospectos, lo que causaba fallos de integridad en Prisma.
3.  **Robustez de Provider:** Se corrigió un bug en `google-maps.provider.ts` que provocaba fallos con direcciones de Google Maps que no contenían el array de `types`.

**Estado de Validación:**
- **Discovery:** 100% Funcional. Datos estructurados de empresas reales.
- **Pipeline:** 100% Funcional. Los candidatos llegan hasta la fase de evaluación.
- **Evaluation:** Pendiente de recarga de saldo en Claude para validar el scoring y lógica de `PROMOTE/DISCARD`.

**Conclusión:** Discovery Crisis: **CLOSED**. Próximo foco de auditoría: **Validación funcional ERP-052**.

## OpportunityEngine Elimination & Claude Commercial Evaluation — 2026-06-22

**Status:** ✅ COMPLETADO

**Decisión de Producto:** OpportunityEngine determinístico (SERVICES_CATALOG_MACHINE.json) fue eliminado y reemplazado con evaluación comercial basada en Claude API.

**Root Cause del Cambio:**
- OpportunityEngine tenía catálogo hardcodeado por industria (restrictive rules para Inmobiliaria, Abogado, Contador)
- Problemas: Cambios a catálogo no se reflejaban sin server restart, industrias unsupported recibían 0 opportunities
- Auditoría con datos reales (LACANNA) mostró falsos negativos (Meta Pixel bloqueaba CRM)

**Arquitectura Nueva:** `Playwright (signals) → Claude (reasoning) → enrichment_results (persistent)`

### Implementación: 2 commits separados y limpios

**Commit 1: Eliminación de OpportunityEngine** 
```
Eliminados:
- apps/api/src/modules/enrichment/opportunity-engine.service.ts (300+ líneas)
- apps/api/src/modules/enrichment/opportunity-engine.spec.ts
- apps/api/src/modules/enrichment/SERVICES_CATALOG_MACHINE.json
```

**Commit 2: Claude-based Commercial Evaluation**
```
Creado:
- apps/api/src/modules/enrichment/enrichment-evaluator.service.ts (140 líneas)
  ├─ Inyección ConfigService para ANTHROPIC_API_KEY
  ├─ evaluate(prospect, contact, signals) → Promise<{ score, problems, opportunities, recommendedServices, totalEstimatedTicketUsd, reasoning }>
  ├─ callClaudeAPI(prompt) → fetch a https://api.anthropic.com/v1/messages (modelo claude-opus-4-1-20250805)
  └─ formatSignals() para limitar output a 15 top signals

Modificado:
- enrichment.module.ts: agregar EnrichmentEvaluatorService provider/export
- enrichment.service.ts:
  ├─ Inyectar EnrichmentEvaluatorService
  ├─ Reemplazar Fase B: OpportunityEngine.detect() → this.evaluator.evaluate()
  ├─ opportunityScore ahora = claudeResult.score (no más activatedCount*25)
  └─ Persistencia: opportunityScore, opportunities[], summary, estimatedTicket desde Claude
- research.controller.ts: deprecar @Post('opportunity-test'), remover OpportunityEngineService
```

### Flujo Operacional

```mermaid
1. Usuario: "Generar análisis comercial"
   ↓
2. Estado: NUEVO → INVESTIGADO (ingresa job a queue)
   ↓
3. Fase A: Playwright Audit (0 tokens, determinístico)
   Input: prospect.website
   Output: { accessible, hasMetaPixel, structuredData, ... 41+ signals }
   ↓
4. Fase B: Claude Commercial Evaluation (1 API call ~500-800 tokens)
   Input: { prospect: {id, nombreEmpresa, rubro, ciudad, website}, contact: {email, telefono, ...}, signals }
   Output: {
     score: 0-100,
     problems: ["gap1", "gap2"],
     opportunities: [{title, description, estimatedTicketUsd, priority, reasoning}],
     recommendedServices: ["service1", "service2"],
     totalEstimatedTicketUsd: 5000,
     reasoning: "clear digital gap in..."
   }
   ↓
5. Persistencia: enrichment_results
   ├─ opportunityScore = Claude score
   ├─ opportunities = Claude array
   ├─ summary = Claude reasoning.substring(0, 255)
   ├─ estimatedTicket = Claude totalEstimatedTicketUsd
   └─ signals = Playwright completos
   ↓
6. Estado: INVESTIGADO → ENRIQUECIDO
   ↓
7. UI: Mostrar opportunities + score + reasoning
   ↓
8. Human: Aprobar/rechazar en enrichment review
```

### Base de Datos
✅ **Sin cambios de schema.** Reutiliza enrichment_results existente:
- `opportunityScore` (int): antes = activatedCount*25, ahora = Claude score (0-100)
- `opportunities` (JSON): antes = OpportunityEngine array, ahora = Claude array (estructura compatible)
- `summary` (varchar): antes = "Detected N opp", ahora = Claude reasoning
- `estimatedTicket` (decimal): antes = NULL, ahora = Claude totalEstimatedTicketUsd

### UI (ERPPrototype.tsx)
✅ **Sin cambios de estructura.** Opportunities ahora de Claude pero schema compatible:
- Renderiza `opp.title`, `opp.description`, `opp.priority`, `opp.estimatedTicketUsd`
- Progress bar con `opportunityScore` (0-100)
- Muestra `summary` de Claude como reasoning

### Impacto Comercial

| Aspecto | Before | After |
|---------|--------|-------|
| **Cobertura de industrias** | 4 rubros soportados (Wine, Food, Retail, Tourism) | ✅ Todos los rubros (Inmobiliaria, Abogado, Veterinaria, etc.) |
| **Falsos negativos** | Meta Pixel=true bloqueaba CRM | ✅ Claude evalúa en contexto |
| **Score** | Regla: activatedCount*25 | ✅ Razonamiento comercial (0-100) |
| **Dinámico** | Requería server restart | ✅ Instant (sin cache) |
| **Reasoning** | Determinístico (sin explicación) | ✅ Detallado de Claude |

### Monitoreo Post-Deploy
- ✅ npm run build sin errores
- ✅ enrichmentJob.status: PENDING → RUNNING → COMPLETED
- ✅ prospects: NUEVO → INVESTIGADO → ENRIQUECIDO
- ✅ opportunityScore: 0-100 (no más 25, 50, 75, 100)
- ✅ opportunities: array con title/description/ticket/priority
- ✅ enrichmentResult.reviewStatus: PENDING → APPROVED/REJECTED
- ✅ ANTHROPIC_API_KEY en .env configurada

