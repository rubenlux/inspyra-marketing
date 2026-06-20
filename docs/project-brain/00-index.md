cd# Project Brain — Índice

**Última actualización:** 2026-06-07  
**Mantenedor:** Equipo Inspyra

---

## Qué es Project Brain

Project Brain es la memoria persistente del proyecto Inspyra. Su propósito es eliminar la pérdida de contexto entre sesiones: cualquier agente o colaborador puede leer estos documentos y entender el sistema sin depender de chats previos, decisiones verbales o código disperso.

No es documentación decorativa. Es infraestructura de desarrollo.

---

## Cómo leerlo

Cada archivo tiene un número de orden. Para entender el proyecto desde cero, seguir ese orden. Para tareas específicas, ir directo al archivo relevante.

**Punto de entrada para Claude:** `CLAUDE_PROJECT_CONTEXT.md` (raíz del repo)

---

## Archivos

| Archivo | Contenido | Cuándo leerlo |
|---|---|---|
| `01-vision.md` | Qué es Inspyra, qué no es, prioridades | Siempre primero |
| `02-architecture.md` | Frontend, backend, agentes, principios | Antes de tocar código |
| `03-ui-rules.md` | Reglas obligatorias de UI | Antes de cualquier cambio frontend |
| `04-commercial-rules.md` | Reglas de outreach LATAM/USA | Antes de generar mensajes comerciales |
| `05-proposal-rules.md` | Reglas del Proposal Engine | Antes de modificar propuestas |
| `06-state-machines.md` | Estados completos + transiciones válidas | Ante cualquier cambio de estado |
| `07-agent-rules.md` | Responsabilidades de cada agente IA | Antes de modificar agentes |
| `08-known-decisions.md` | Registro histórico de decisiones | Antes de proponer algo nuevo |
| `09-roadmap.md` | Completado, en curso, futuro | Para entender qué sigue |

---

## Fuentes complementarias

- **`spec-driven/`** — constitución técnica del sistema (29 specs ERP-001 a ERP-031)
- **`specs/security/`** — SEC-001 y SEC-002 obligatorios en toda implementación
- **`specs/standards/`** — estándares de frontend, backend, testing, infra
- **`CLAUDE.md`** — instrucciones operativas para Claude Code

---

## Obligatoriedad

**Project Brain es obligatorio. No es documentación opcional.**

Antes de cualquier tarea de implementación, Claude debe leer:
1. `CLAUDE_PROJECT_CONTEXT.md` — siempre
2. Los archivos de Project Brain relevantes al dominio afectado

Ignorar Project Brain en favor de "inferir desde el código" es el comportamiento que este sistema existe para prevenir. La documentación contiene decisiones que no son inferibles del código.

---

## Regla de actualización

Cuando una decisión importante se toma o cambia, debe registrarse en `08-known-decisions.md`. Project Brain no debe quedar desactualizado más de una semana respecto al código.
