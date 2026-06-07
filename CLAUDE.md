# CLAUDE.md

## Proyecto

Inspyra ERP y ecosistema Inspyra deben seguir un enfoque spec-first.

## Project Brain (leer primero)

Antes de cualquier tarea, leer:

- `CLAUDE_PROJECT_CONTEXT.md` — resumen ejecutivo del sistema, invariantes y puntos de entrada
- `docs/project-brain/` — memoria persistente completa: arquitectura, reglas UI, estados, agentes, decisiones históricas

El Project Brain contiene decisiones que no están en el código ni en las specs. Leerlo evita proponer cosas ya descartadas y duplicar trabajo existente.

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
