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
- El Opportunity Agent (`runAgent`) funciona sin `problemasEncontrados` — usa SIR catalog via `buildProspectContext()`. NO re-agregar la guard `if (problems.length === 0) throw 400`.

**Google Maps Discovery**
- Los prospectos importados desde Google Maps entran en estado `NUEVO`.
- `enrichmentApi.createJob()` avanza NUEVO → INVESTIGADO automáticamente antes de correr el enriquecimiento. VALID_TRANSITIONS lo permite.
- El score heurístico (campo `score`) se setea en el import; no requiere Opportunity Agent para tener score > 0.
- `problemasEncontrados` se puebla con los gaps detectados (Sin sitio web, Sin GBP, etc.) para habilitar el Opportunity Agent inmediatamente.

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

## ERP Functional Specs

Las specs funcionales oficiales del ERP viven en:

- `spec-driven/`

Este directorio esta en la raiz del proyecto y contiene la constitucion del sistema y las specs `ERP-001` a `ERP-050` (en crecimiento).

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
