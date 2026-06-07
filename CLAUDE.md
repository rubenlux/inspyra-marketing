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

Este directorio esta en la raiz del proyecto y contiene la constitucion del sistema y las specs `ERP-001` a `ERP-023`.

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

## Prioridad

En caso de conflicto:

1. Security specs
2. Backend / architecture specs
3. ERP module specs
4. Local implementation details

Security siempre tiene prioridad.
