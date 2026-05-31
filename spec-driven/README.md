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
| 07 | ERP-006 | [07-erp-006-delivery-clientes.md](./07-erp-006-delivery-clientes.md) | Módulo Delivery — Clientes + Ficha 360° + Health Score + Upsell IA | 🟡 DRAFT v1 |
| 08 | ERP-007 | [08-erp-007-delivery-servicios.md](./08-erp-007-delivery-servicios.md) | Módulo Delivery — Servicios + Catálogo + Entregables + Margen | 🟡 DRAFT v1 |
| 09 | ERP-008 | [09-erp-008-delivery-proyectos.md](./09-erp-008-delivery-proyectos.md) | Módulo Delivery — Proyectos + Hitos + Time Tracking + Riesgo IA | 🟡 DRAFT v1 |
| 10 | ERP-009 | [10-erp-009-delivery-tareas.md](./10-erp-009-delivery-tareas.md) | Módulo Delivery — Tareas + Kanban + Activity Log + Recurrencia | 🟡 DRAFT v1 |
| 11 | ERP-010 | [11-erp-010-studio-laboratorio-ia.md](./11-erp-010-studio-laboratorio-ia.md) | Módulo Studio — Laboratorio IA + Orquestador + Cost Governance | 🟡 DRAFT v1 |
| 12 | ERP-011 | [12-erp-011-operations-finanzas.md](./12-erp-011-operations-finanzas.md) | Módulo Operations — Finanzas + Facturación + Rentabilidad + Multi-BU | 🟡 DRAFT v1 |
| 13 | ERP-012 | [13-erp-012-operations-facturacion-cobranza.md](./13-erp-012-operations-facturacion-cobranza.md) | Módulo Operations — Facturación & Cobranza + Recurrentes + Morosidad | 🟡 DRAFT v1 |
| 14 | ERP-013 | [14-erp-013-operations-tickets-soporte.md](./14-erp-013-operations-tickets-soporte.md) | Módulo Operations — Tickets & Soporte + SLA + Escalación + CSAT | 🟡 DRAFT v1 |
| 15 | ERP-014 | [15-erp-014-operations-reportes-analytics.md](./15-erp-014-operations-reportes-analytics.md) | Módulo Operations — Reportes & Analytics + 12 dashboards + IA conversacional | 🟡 DRAFT v1 |
| 16 | ERP-015 | [16-erp-015-hostingguard.md](./16-erp-015-hostingguard.md) | HostingGuard — Integración ERP + deployments + subdominios + SSL + billing | 🟡 DRAFT v1 |
| 17 | ERP-016 | [17-erp-016-inspyra-cloud.md](./17-erp-016-inspyra-cloud.md) | Inspyra Cloud — Integración ERP + workloads AWS + Cost Explorer + monitoring | 🟡 DRAFT v1 |
| 18 | ERP-017 | [18-erp-017-inspyra-mail.md](./18-erp-017-inspyra-mail.md) | Inspyra Mail — Inbox unificado + clasificación IA + secuencias + formularios web | 🟡 DRAFT v1 |

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
