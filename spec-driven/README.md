# Inspyra ERP — Spec-Driven

Este directorio contiene todas las especificaciones del sistema Inspyra ERP.

## Filosofía

> Spec first → Plan → Tasks → Build.
> Nunca construir primero y pensar después.

Toda nueva feature, módulo o decisión arquitectónica debe tener una spec antes de implementarse.

## Índice de specs

| # | Archivo | Descripción | Estado |
|---|---|---|---|
| 01 | [constitution-v1.md](./01-constitution-v1.md) | Propósito, principios, arquitectura y stack | ✅ Aprobada |

## Convención de nombres

```
NN-nombre-descriptivo.md
```

- `NN` = número de orden con cero a la izquierda (01, 02, 03…)
- nombre en kebab-case
- siempre `.md`

## Estados posibles

- 🟡 `DRAFT` — en redacción, no aprobada
- ✅ `APPROVED` — aprobada, puede implementarse
- 🔵 `IN PROGRESS` — siendo implementada
- ✅ `DONE` — implementada y cerrada
- 🔴 `REJECTED` — descartada con justificación
- ⏸️ `PARKED` — pausada, puede retomarse
