# CLAUDE PROJECT CONTEXT

**Leer este archivo primero. Siempre.**

Última actualización: 2026-06-07

> **ERP-034 — Enforcement activo:** Este archivo es cargado automáticamente via hook `UserPromptSubmit` en `.claude/settings.json`. Los invariantes también están inlineados en `CLAUDE.md`. Si estás leyendo esto, el sistema funciona.

---

## Qué es este proyecto

**Inspyra ERP** — sistema operativo interno de la agencia de marketing digital Inspyra.

El ERP centraliza: prospección → calificación → outreach → clientes → delivery → reporting.

**No es un SaaS. No se vende como producto. Es la herramienta del equipo de Inspyra.**

---

## Prioridad máxima

> ¿Esta tarea acerca un prospecto a convertirse en cliente?

Esa es la pregunta que determina prioridad. Todo lo demás es secundario.

---

## Antes de escribir cualquier código

### 1. Leer la spec correspondiente

Las specs viven en `spec-driven/`. Cada módulo tiene su spec. Leerla antes de modificar el módulo.

### 2. Leer las reglas de UI si tocás el frontend

`docs/project-brain/03-ui-rules.md` — contiene las restricciones obligatorias.

**Resumen de UI rules:**
- `ERPPrototype.tsx` es el único frontend. No crear páginas nuevas.
- No crear dashboards dentro de dashboards.
- No duplicar KPIs, tabs, filtros, ni drawers.
- Todo cambio UI va dentro del drawer/tabs existentes.

### 3. Revisar las decisiones conocidas

`docs/project-brain/08-known-decisions.md` — antes de proponer algo, verificar que no fue ya decidido y descartado.

---

## Stack en 30 segundos

```
Frontend:  React + Vite · src/erp/ERPPrototype.tsx (6.000+ líneas, @ts-nocheck)
API:       NestJS + Prisma · apps/api/src/modules/ (18 módulos)
DB:        PostgreSQL :5433
Auth:      JWT · JwtAuthGuard · @CurrentUser() decorator
Agentes:   spawn('claude', ...) subproceso · output JSON → Prisma
```

---

## Flujo comercial (el corazón del sistema)

```
NUEVO → INVESTIGADO → ENRIQUECIDO → LISTO_PROPUESTA → LISTO_OUTREACH
→ CONTACTADO → RESPONDIO → REUNION_AGENDADA → PASO_A_PIPELINE → CONVERTIDO
```

Cada flecha es una aprobación humana. Los agentes proponen, los humanos aprueban.

---

## Invariantes que nunca se rompen

1. **Human approval obligatoria** — ningún agente aprueba su propio output
2. **Tenant isolation** — toda query lleva `where: { tenantId }`
3. **VALID_TRANSITIONS** — el estado del prospecto solo puede cambiar según la tabla en `prospects.service.ts`
4. **Propuesta en idioma del prospecto** — el operador trabaja en español, el prospecto recibe su idioma
5. **No duplicar** — antes de crear algo nuevo, verificar que no existe ya

---

## Project Brain (memoria completa)

Para contexto profundo, leer en orden:

| Archivo | Cuándo leer |
|---|---|
| [`docs/project-brain/01-vision.md`](docs/project-brain/01-vision.md) | Siempre |
| [`docs/project-brain/02-architecture.md`](docs/project-brain/02-architecture.md) | Antes de tocar backend |
| [`docs/project-brain/03-ui-rules.md`](docs/project-brain/03-ui-rules.md) | Antes de tocar frontend |
| [`docs/project-brain/04-commercial-rules.md`](docs/project-brain/04-commercial-rules.md) | Antes de generar outreach |
| [`docs/project-brain/05-proposal-rules.md`](docs/project-brain/05-proposal-rules.md) | Antes de modificar proposals |
| [`docs/project-brain/06-state-machines.md`](docs/project-brain/06-state-machines.md) | Antes de cambiar estados |
| [`docs/project-brain/07-agent-rules.md`](docs/project-brain/07-agent-rules.md) | Antes de modificar agentes |
| [`docs/project-brain/08-known-decisions.md`](docs/project-brain/08-known-decisions.md) | Antes de proponer algo nuevo |
| [`docs/project-brain/09-roadmap.md`](docs/project-brain/09-roadmap.md) | Para entender qué sigue |

---

## Specs técnicas oficiales

- `spec-driven/` — constitución del sistema (ERP-001 a ERP-031, 29 archivos)
- `specs/security/SEC-001-security-baseline.md` — obligatorio
- `specs/security/SEC-002-security-testing.md` — obligatorio
- `specs/standards/` — estándares de frontend, backend, testing, infra

---

## Archivos críticos del codebase

| Archivo | Descripción |
|---|---|
| `apps/api/prisma/schema.prisma` | Fuente de verdad del schema de DB |
| `apps/api/src/app.module.ts` | Módulos NestJS registrados |
| `apps/api/src/modules/prospects/prospects.service.ts` | VALID_TRANSITIONS, lógica core de prospectos |
| `src/erp/ERPPrototype.tsx` | Todo el frontend |
| `src/api/inspyra.ts` | Todos los clientes de API |

---

## Lo que NO se hace (nunca)

- Crear páginas nuevas sin justificación técnica explícita
- Crear dashboards paralelos
- Duplicar estados, endpoints o componentes
- Saltar capas (agente → DB directamente)
- Aprobar sin revisión humana
- Introducir secretos en el código
- Modificar VALID_TRANSITIONS sin leer la spec primero

---

## Cómo funciona el enforcement (ERP-034)

Project Brain no depende de que el agente recuerde leerlo. Está integrado en tres capas:

| Capa | Mecanismo | Garantía |
|---|---|---|
| **CLAUDE.md** | Invariantes inlineados + checklist | Siempre cargado por Claude Code |
| **Hook `UserPromptSubmit`** | `.claude/settings.json` → `brain-reminder.py` | Inyecta checklist al inicio de cada prompt |
| **Este archivo** | `CLAUDE_PROJECT_CONTEXT.md` | Referenciado desde CLAUDE.md y desde el hook |

### ¿Cómo saber si el hook está funcionando?

Al inicio de cada interacción con Claude Code en este proyecto debería aparecer el bloque:
```
╔══════════════════════════════════════════════════════════╗
║              PROJECT BRAIN — CHECKLIST ACTIVO            ║
...
╚══════════════════════════════════════════════════════════╝
```

Si no aparece, verificar que `.claude/settings.json` existe y contiene el hook `UserPromptSubmit`.

### Actualizar Project Brain

Cuando se toma una decisión importante nueva:
1. Agregar entrada en `docs/project-brain/08-known-decisions.md`
2. Si es una regla de UI → actualizar `docs/project-brain/03-ui-rules.md`
3. Si es una regla comercial → actualizar `docs/project-brain/04-commercial-rules.md`
4. Si cambia un estado → actualizar `docs/project-brain/06-state-machines.md`
5. Actualizar `Última actualización:` en este archivo
