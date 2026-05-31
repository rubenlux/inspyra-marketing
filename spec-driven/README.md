# Inspyra ERP — Spec-Driven

Este directorio contiene todas las especificaciones del sistema Inspyra ERP.

## Filosofía

> Spec first → Plan → Tasks → Build.
> Nunca construir primero y pensar después.

Toda nueva feature, módulo o decisión arquitectónica debe tener una spec antes de implementarse.

## Índice de specs

| # | Código | Archivo | Descripción | Estado |
|---|---|---|---|---|
| 01 | — | [01-constitution-v1.md](./01-constitution-v1.md) | Propósito, principios, arquitectura y stack | ✅ APPROVED |
| 02 | ERP-001 | [02-erp-001-comercial-prospectos.md](./02-erp-001-comercial-prospectos.md) | Módulo Comercial — Prospectos completo | 🟡 DRAFT v1 |
| 03 | ERP-002 | [03-erp-002-comercial-campanas.md](./03-erp-002-comercial-campanas.md) | Módulo Comercial — Campañas + Leads + Bots | 🟡 DRAFT v1 |
| 04 | ERP-003 | [04-erp-003-comercial-seguimiento.md](./04-erp-003-comercial-seguimiento.md) | Módulo Comercial — Seguimiento + Follow-up + IA | 🟡 DRAFT v1 |
| 05 | ERP-004 | [05-erp-004-comercial-pipeline.md](./05-erp-004-comercial-pipeline.md) | Módulo Comercial — Pipeline + Kanban + Forecast + Auto-onboarding | 🟡 DRAFT v1 |
| 06 | ERP-005 | [06-erp-005-comercial-reuniones.md](./06-erp-005-comercial-reuniones.md) | Módulo Comercial — Reuniones + Briefing IA + Outcomes + CRM Update | 🟡 DRAFT v1 |

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
