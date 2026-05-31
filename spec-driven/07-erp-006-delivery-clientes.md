# ERP-006 — Delivery / Clientes

**Spec ID:** 07  
**Código:** ERP-006  
**Módulo:** Delivery → Clientes  
**Estado:** 🟡 DRAFT v1  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  

---

## Objetivo del módulo

El módulo Clientes centraliza toda la información operativa, comercial, contractual y estratégica de cada cliente activo dentro de Inspyra.

Es la **ficha maestra del cliente** dentro del ERP.

Representa el momento en el que una oportunidad comercial se convierte en relación activa.

---

## Principio central

> **Un cliente = una fuente única de verdad.**

Todo lo relacionado al cliente debe poder encontrarse desde su ficha.  
Desde ahí se abre toda su operación.

---

## Qué resuelve

| Sin módulo Clientes | Con módulo Clientes |
|---|---|
| Información repartida entre chats y documentos | Ficha única por cliente |
| Pérdida de contexto del cliente | Historial completo centralizado |
| Difícil acceso al historial | Acceso rápido al contexto comercial |
| Desorden en servicios activos | Relación directa con servicios y proyectos |
| Poca trazabilidad de facturación | Control contractual y económico |
| Pérdida de oportunidades de upsell | Visión 360° de la cuenta |

---

## Qué vive dentro del módulo

Toda empresa o cuenta activa que haya contratado algún servicio de Inspyra:

- Empresas con sitio web activo
- Clientes SEO / Ads / Branding / Email Marketing
- Clientes HostingGuard / Cloud
- Clientes Desarrollo de Software
- Clientes mantenimiento mensual
- Clientes consultoría

---

## Qué NO vive aquí

| ❌ No aquí | ✅ Dónde va |
|---|---|
| Prospectos | Módulo Prospectos |
| Leads inbound sin cierre | Módulo Campañas / Seguimiento |
| Oportunidades abiertas | Módulo Pipeline |
| Campañas internas de Inspyra | Módulo Campañas |

---

## Flujo de alta de cliente

```
Pipeline: Ganado → Creación automática ficha → Vinculación histórica → Activación operativa → Relación continua
```

### Paso 1 — Conversión desde Pipeline

La oportunidad en Pipeline pasa a estado `ganado`.

### Paso 2 — Alta automática de cliente

El ERP crea la ficha del cliente automáticamente mediante el **Client Creation Bot**.

### Paso 3 — Vinculación comercial histórica

Se preserva y vincula:

| Dato | Origen |
|---|---|
| Origen del lead | Módulo Prospectos / Campañas |
| Campaña asociada | Módulo Campañas |
| Pipeline original | Módulo Pipeline |
| Propuesta cerrada | Módulo Propuestas |
| Valor de la venta | Deal `valor_estimado_usd` |

### Paso 4 — Activación operativa

Se asigna automáticamente:

- Account owner
- Servicios vendidos
- Proyecto inicial
- Tarea de onboarding

### Paso 5 — Relación continua

Toda actividad futura (reuniones, proyectos, tickets, facturas) queda vinculada a la ficha del cliente.

---

## Modelo de datos

### Cliente (entidad principal)

#### Identificación

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único |
| `razon_social` | string | Razón social legal |
| `nombre_comercial` | string | Nombre con el que se conoce internamente |
| `cuit_identificacion` | string | CUIT / RFC / identificación fiscal |
| `pais` | string | País |
| `ciudad` | string | Ciudad |
| `direccion` | string | Dirección física (opcional) |

#### Gestión interna

| Campo | Tipo | Descripción |
|---|---|---|
| `account_owner_id` | uuid (FK User) | Responsable principal de la cuenta |
| `estado_cuenta` | enum | Ver estados posibles |
| `fecha_alta` | date | Fecha de inicio como cliente |

#### Origen comercial (trazabilidad)

| Campo | Tipo | Descripción |
|---|---|---|
| `deal_origen_id` | uuid (FK Deal) | Oportunidad que generó este cliente |
| `campana_origen_id` | uuid (FK Campaign) | Campaña origen si aplica (nullable) |
| `comercial_cierre_id` | uuid (FK User) | Usuario que cerró la venta |
| `propuesta_ganada_id` | uuid (FK) | Propuesta que se aceptó (nullable) |
| `ticket_inicial_usd` | decimal | Valor de la primera venta |

#### Información financiera

| Campo | Tipo | Descripción |
|---|---|---|
| `billing_cycle` | enum | mensual / trimestral / semestral / anual / unico |
| `fee_mensual_usd` | decimal | Fee mensual recurrente |
| `fee_anual_usd` | decimal | Fee anual (si aplica) |
| `ultima_factura_at` | date | Fecha de última factura emitida |
| `proximo_vencimiento_at` | date | Próxima fecha de pago |
| `deuda_pendiente_usd` | decimal | Deuda acumulada pendiente |
| `revenue_lifetime_usd` | decimal (calculado) | Facturación total histórica |
| `mrr_usd` | decimal (calculado) | Monthly Recurring Revenue de esta cuenta |

#### Infraestructura (si aplica)

| Campo | Tipo | Descripción |
|---|---|---|
| `dominio` | string | Dominio principal (nullable) |
| `hosting_id` | uuid (FK HostingGuard) | Servidor asignado (nullable) |
| `vps_id` | uuid (FK) | VPS asignada (nullable) |
| `cloud_project_id` | uuid (FK InspyraCloud) | Proyecto cloud (nullable) |
| `ssl_expira_at` | date | Fecha de expiración SSL (nullable) |
| `email_service` | string | Servicio de email configurado (nullable) |

#### Salud de cuenta (calculado por IA/bots)

| Campo | Tipo | Descripción |
|---|---|---|
| `health_score` | int (0–100) | Score de salud de la cuenta |
| `satisfaccion_estimada` | enum | baja / media / alta |
| `riesgo_churn` | enum | bajo / medio / alto / crítico |
| `oportunidad_upsell` | boolean | Si hay oportunidad de venta adicional detectada |
| `oportunidad_crosssell` | boolean | Si hay oportunidad de servicio complementario |

#### Metadata

| Campo | Tipo | Descripción |
|---|---|---|
| `created_at` | timestamp | Fecha de creación de la ficha |
| `updated_at` | timestamp | Última actualización |

---

### Contacto de cliente (entidad relacionada — uno a muchos)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `cliente_id` | uuid (FK) | Cliente al que pertenece |
| `nombre` | string | Nombre completo |
| `cargo` | string | Cargo dentro de la empresa |
| `email` | string | Email de contacto |
| `telefono` | string | Teléfono |
| `whatsapp` | string | WhatsApp (puede diferir del teléfono) |
| `es_principal` | boolean | Si es el contacto principal de la cuenta |
| `notas` | text | Notas libres sobre el contacto |

---

## Estados de cuenta

| Estado | Descripción |
|---|---|
| `onboarding` | Recién convertido, en proceso de activación |
| `activo` | Cliente en operación normal |
| `pausado` | Servicio temporalmente pausado por el cliente |
| `suspendido` | Suspendido por deuda o incumplimiento |
| `cancelado` | Canceló el servicio (documentar motivo) |
| `finalizado` | Proyecto puntual completado sin recurrencia |

---

## Pestañas de la ficha de cliente

| Pestaña | Contenido |
|---|---|
| **Overview** | Resumen general: datos clave, estado, salud, KPIs de cuenta |
| **Contactos** | Todos los contactos vinculados con roles |
| **Servicios** | Servicios activos e históricos contratados |
| **Proyectos** | Proyectos vinculados (activos y finalizados) |
| **Facturación** | Facturas, pagos, deuda, historial financiero |
| **Infraestructura** | Hosting, VPS, Cloud, dominios, SSL |
| **Reuniones** | Historial completo de reuniones comerciales y operativas |
| **Notas** | Documentación interna libre del equipo |
| **Tickets** | Solicitudes de soporte y su estado |
| **Archivos** | Propuestas, contratos, adjuntos, documentos firmados |

---

## KPIs del módulo

| KPI | Descripción | Cálculo |
|---|---|---|
| Total clientes activos | Estado `activo` + `onboarding` | COUNT |
| Clientes nuevos este mes | `fecha_alta` en el mes actual | COUNT |
| MRR total | Suma de `mrr_usd` de todos los clientes activos | SUM |
| Revenue acumulado | Suma de `revenue_lifetime_usd` | SUM |
| Ticket promedio | MRR medio por cliente | AVG(mrr_usd) |
| Clientes onboarding | Estado `onboarding` | COUNT |
| Clientes con deuda | `deuda_pendiente_usd > 0` | COUNT + SUM |
| Clientes en riesgo | `riesgo_churn IN (alto, crítico)` | COUNT |
| Oportunidades upsell | `oportunidad_upsell = true` | COUNT |
| Churn mensual | Clientes cancelados / total activos inicio de mes | % |

---

## Bots y automatizaciones

| Bot | Trigger | Acción |
|---|---|---|
| **Client Creation Bot** | Deal pasa a `ganado` en Pipeline | Crea ficha cliente + contacto principal + vinculación histórica |
| **Client Health Bot** | Diariamente | Recalcula `health_score` por cliente |
| **Churn Risk Bot** | `health_score` cae o hay señales de riesgo | Actualiza `riesgo_churn` + alerta al account owner |
| **Upsell Opportunity Bot** | Análisis mensual de servicios contratados vs disponibles | Marca `oportunidad_upsell = true` + crea oportunidad en Pipeline |
| **Payment Reminder Bot** | `proximo_vencimiento_at` - 7 días | Notificación interna + recordatorio al cliente |
| **Client Activity Bot** | Lunes 08:00 | Genera resumen de actividad reciente por cliente |
| **Renewal Reminder Bot** | Contrato/servicio a 30 días de vencer | Alerta al account owner para gestionar renovación |

---

## Capacidades IA del módulo

| Función IA | Descripción |
|---|---|
| **Resumen automático del cliente** | Estado actual en 5 líneas para brief rápido |
| **Health score inteligente** | Calcula salud de cuenta con múltiples señales |
| **Detección de riesgo churn** | Patrones de comportamiento que anticipan cancelación |
| **Sugerencias de upsell** | Identifica servicios complementarios según perfil |
| **Resumen ejecutivo mensual** | Informe de cuenta del mes para account owner |
| **Timeline de relación comercial** | Hitos clave desde prospecto hasta hoy |
| **Detección de oportunidades futuras** | Basado en sector, tamaño y servicios del cliente |

Toda ejecución IA debe registrar métricas de coste según `01-constitution-v1.md §7`.

---

## Relaciones con otros módulos

| Módulo | Relación |
|---|---|
| **Pipeline** | El cliente nace desde un Deal `ganado` |
| **Reuniones** | Historial de reuniones vinculadas a la cuenta |
| **Servicios** | Lista de servicios contratados activos e históricos |
| **Proyectos** | Proyectos activos y finalizados del cliente |
| **Finanzas** | Facturación, cobros, MRR, deuda |
| **HostingGuard** | Infraestructura de hosting del cliente |
| **Inspyra Cloud** | Proyecto cloud del cliente (si aplica) |
| **Tickets** | Solicitudes de soporte abiertas y cerradas |

---

## Reglas críticas de negocio

### Regla 1 — Owner obligatorio
Todo cliente debe tener `account_owner_id` asignado. Sin owner → alerta inmediata al admin.

### Regla 2 — Contacto principal obligatorio
Todo cliente debe tener al menos un contacto con `es_principal = true`. Sin contacto → el sistema bloquea la activación.

### Regla 3 — Servicio activo obligatorio
Todo cliente debe tener al menos un servicio activo o histórico registrado.

### Regla 4 — Trazabilidad comercial preservada
Todo cliente debe conservar `deal_origen_id` y `comercial_cierre_id`. Esta información nunca puede eliminarse.

### Regla 5 — Nada fuera del ERP
Toda comunicación, nota, archivo o actividad relacionada al cliente debe registrarse en el ERP.

---

## Las 8 preguntas que debe poder responder el módulo

| Pregunta | Campo / Fuente |
|---|---|
| ¿Quién es este cliente? | `razon_social` + `nombre_comercial` + contactos |
| ¿Qué contrató? | Pestaña Servicios |
| ¿Cuánto factura? | `mrr_usd` + `revenue_lifetime_usd` |
| ¿Qué estamos haciendo para él? | Pestaña Proyectos + Tareas |
| ¿Qué infraestructura tiene? | Pestaña Infraestructura |
| ¿Quién lo gestiona? | `account_owner_id` |
| ¿Qué se habló con él? | Pestaña Reuniones + Notas |
| ¿Qué oportunidad futura existe? | `oportunidad_upsell` + `oportunidad_crosssell` + IA |

---

## Criterios de aceptación (DoD)

Para que esta spec se considere implementada:

- [ ] Alta automática de cliente desde evento `deal.won` en Pipeline
- [ ] Ficha cliente con las 10 pestañas navegables
- [ ] Validación: owner obligatorio, contacto principal obligatorio, servicio obligatorio
- [ ] Trazabilidad comercial preservada (deal + campaña + comercial + propuesta)
- [ ] KPIs del dashboard en tiempo real (especialmente MRR total)
- [ ] Listado de clientes con filtros (estado, owner, riesgo churn, upsell)
- [ ] Health score calculado y visible en la ficha
- [ ] Riesgo churn visible con alerta al owner cuando es alto/crítico
- [ ] Oportunidades upsell marcadas y visibles
- [ ] Payment Reminder Bot activo con 7 días de anticipación
- [ ] Resumen IA del cliente generado en Overview
- [ ] Resumen ejecutivo mensual generado automáticamente
- [ ] Múltiples contactos por cliente con rol definido
- [ ] Exportar listado de clientes a CSV
- [ ] Historial de cambios de estado de cuenta (auditoría)
- [ ] Métricas IA registradas por cada ejecución

---

## Próximos pasos

1. Aprobar esta spec con el equipo
2. Crear `08-erp-007-delivery-servicios.md`
3. Definir schema Prisma para entidades `Client` y `ClientContact`
4. Diseñar endpoints REST (`/api/clients`, `/api/clients/:id/contacts`)
5. Definir el evento `deal.won` como trigger del Client Creation Bot
6. Especificar el cálculo del `health_score` (variables de entrada)
