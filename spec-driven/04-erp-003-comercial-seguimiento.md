# ERP-003 — Comercial / Seguimiento

**Spec ID:** 04  
**Código:** ERP-003  
**Módulo:** Comercial → Seguimiento  
**Estado:** 🟡 DRAFT v1  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  

---

## Objetivo del módulo

El módulo Seguimiento es la **bandeja operativa comercial diaria** de Inspyra.

Su función es asegurar que ningún lead, prospecto, contacto, propuesta o cliente potencial quede sin respuesta o sin continuidad comercial.

Es el **centro de follow-up** de la agencia.

---

## Problema que resuelve

| Sin seguimiento | Con seguimiento |
|---|---|
| Leads olvidados | Todo contacto tiene próximo paso |
| Mensajes sin responder | Todo lead tiene responsable asignado |
| Reuniones sin continuidad | Todo contacto tiene fecha futura |
| Propuestas enviadas sin cierre | Nadie queda sin respuesta |
| Oportunidades perdidas | Nadie se enfría sin reactivación |
| Clientes enfriados | |
| Cierres perdidos por falta de insistencia | |

---

## Principio central

> **Ningún lead se pierde.**

Todo lead dentro del ERP debe tener siempre uno de estos estados activos.  
**Nunca puede quedar "en el aire".**

---

## Qué vive dentro de Seguimiento

Todo aquello que necesita una acción comercial futura:

- Prospectos contactados
- Leads inbound respondidos
- Leads sin respuesta
- Reuniones pendientes
- Propuestas enviadas
- Negociaciones abiertas
- Clientes que deben recontactarse
- Leads fríos a reactivar
- Clientes antiguos para upsell

---

## Qué NO vive aquí

| ❌ No aquí | ✅ Dónde va |
|---|---|
| Prospectos sin contactar aún | Módulo Prospectos |
| Campañas activas | Módulo Campañas |
| Oportunidades cerradas | Módulo Clientes |

---

## Flujo del módulo

```
Lead entra → Primer contacto → Espera respuesta → Recontacto → Respuesta positiva → Conversión o descarte
```

### Paso 1 — Lead entra

Puede venir desde:

| Origen | Tipo |
|---|---|
| Prospectos outbound | Outbound |
| Meta Ads / Google Ads | Inbound pago |
| Instagram / Messenger / WhatsApp | Inbound social |
| Formulario web | Inbound web |
| Referido | Referral |
| Reunión previa | Continuación |

### Paso 2 — Primer contacto

Canales posibles:

- Email / WhatsApp / Llamada
- Instagram DM / LinkedIn
- Zoom / Google Meet
- Manual (anotado por el equipo)

### Paso 3 — Espera respuesta

El sistema registra la espera. Si no responde activa follow-up automático.

### Paso 4 — Recontacto automático

Secuencia de recontactos si no hay respuesta:

| Momento | Acción |
|---|---|
| 24 horas | Primer follow-up automático |
| 48 horas | Segundo intento (canal alternativo) |
| 5 días | Recontacto con mensaje diferente |
| 10 días | Secuencia de reactivación |
| 30 días | Marcado como frío, reactivar luego |

### Paso 5 — Respuesta positiva

Si responde → deriva a:

- Reunión agendada
- Propuesta enviada
- Negociación activa

### Paso 6 — Conversión o descarte

| Resultado | Estado final |
|---|---|
| Cierra | `ganado` → pasa a Clientes |
| No avanza | `perdido` con motivo registrado |
| Posterga | `pausado` con fecha de revisión |
| Potencial futuro | `reactivación_futura` |

---

## Bandejas principales

| Bandeja | Descripción | Prioridad |
|---|---|---|
| **Pendientes hoy** | Todo lo que debe atenderse hoy | 🔴 Urgente |
| **Vencidos** | Seguimientos que ya pasaron su fecha | 🔴 Máxima |
| **Sin respuesta +24h** | Contactos esperando respuesta del lead | 🟠 Alta |
| **Recontactos automáticos** | Secuencias generadas por automatización | 🟡 Media |
| **Propuestas sin respuesta** | Seguimiento post propuesta enviada | 🟠 Alta |
| **Clientes a reactivar** | Clientes viejos para volver a contactar | 🟡 Media |
| **Upsell / Cross-sell** | Clientes actuales con oportunidad nueva | 🟢 Oportunidad |

---

## Modelo de datos

### Seguimiento (entidad principal)

#### Identificación y origen

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único |
| `lead_id` | uuid (FK) | Lead asociado (nullable) |
| `prospect_id` | uuid (FK) | Prospecto asociado (nullable) |
| `client_id` | uuid (FK) | Cliente asociado si aplica (nullable) |
| `origen` | enum | outbound / meta_ads / instagram / google_ads / referral / web_form / manual |

#### Responsable y canal

| Campo | Tipo | Descripción |
|---|---|---|
| `owner_id` | uuid (FK User) | Responsable del seguimiento |
| `canal_ultimo_contacto` | enum | whatsapp / email / llamada / zoom / meet / instagram / linkedin |

#### Temporalidad

| Campo | Tipo | Descripción |
|---|---|---|
| `ultimo_contacto_at` | timestamp | Fecha y hora del último contacto realizado |
| `proximo_contacto_at` | timestamp | Fecha y hora de la próxima acción programada |
| `created_at` | timestamp | Fecha de creación del seguimiento |
| `updated_at` | timestamp | Última actualización |

#### Clasificación comercial

| Campo | Tipo | Valores posibles |
|---|---|---|
| `temperatura` | enum | frio / tibio / caliente |
| `prioridad` | enum | baja / media / alta / urgente |
| `estado` | enum | Ver estados posibles |

#### Contenido

| Campo | Tipo | Descripción |
|---|---|---|
| `notas_internas` | text | Notas libres del equipo |
| `resumen_ia` | text | Resumen automático de la conversación generado por IA |
| `objeciones_detectadas` | string[] | Objeciones identificadas por IA |
| `intencion_compra` | enum | baja / media / alta (clasificado por IA) |

#### Relaciones

| Campo | Tipo | Descripción |
|---|---|---|
| `propuesta_id` | uuid (FK) | Propuesta asociada (nullable) |
| `reunion_id` | uuid (FK) | Reunión asociada (nullable) |
| `pipeline_deal_id` | uuid (FK) | Deal en pipeline si avanzó (nullable) |

#### Completitud (regla de negocio)

El sistema marca un seguimiento como **incompleto** si falta alguno de estos 4 campos:

| Campo obligatorio | Error si falta |
|---|---|
| `owner_id` | "Sin responsable asignado" |
| `ultimo_contacto_at` | "Sin último contacto registrado" |
| `proximo_contacto_at` | "Sin próxima acción definida" |
| `estado` | "Sin estado activo" |

---

## Estados posibles

```
Nuevo → Contactado → Esperando respuesta ←→ Seguimiento activo → Recontactar
    → Reunión agendada → Propuesta enviada → Negociación → Cierre pendiente
    → Ganado | Perdido | Pausado | Reactivación futura
```

| Estado | Descripción |
|---|---|
| `nuevo` | Recién asignado, sin contacto realizado |
| `contactado` | Primer mensaje enviado, sin respuesta aún |
| `esperando_respuesta` | Se contactó, esperando respuesta del lead |
| `seguimiento_activo` | Hay conversación activa en curso |
| `recontactar` | Programado para recontactar (sin respuesta previa) |
| `reunion_agendada` | Tiene reunión confirmada en calendario |
| `propuesta_enviada` | Se envió propuesta, pendiente de respuesta |
| `negociacion` | En proceso de negociación activa |
| `cierre_pendiente` | A punto de cerrar, falta confirmación final |
| `ganado` | Cerrado positivamente → pasa a Clientes |
| `perdido` | Cerrado negativamente (documentar motivo) |
| `pausado` | En pausa con fecha de revisión asignada |
| `reactivacion_futura` | Válido pero no ahora, programado a futuro |

---

## KPIs del módulo

| KPI | Descripción |
|---|---|
| Pendientes hoy | Items con `proximo_contacto_at` = hoy |
| Vencidos | Items con `proximo_contacto_at` < hoy y sin acción |
| Sin respuesta +24h | Items en estado `esperando_respuesta` > 24h |
| Sin respuesta +7d | Items en estado `esperando_respuesta` > 7 días |
| Seguimientos activos | Estado `seguimiento_activo` |
| Recontactos automáticos | Generados por bots en las últimas 24h |
| Leads calientes | Temperatura `caliente` |
| Propuestas pendientes | Estado `propuesta_enviada` |
| Cierres esperados esta semana | Estado `cierre_pendiente` con fecha esta semana |

---

## Bots y automatizaciones

| Bot / Automatización | Trigger | Acción |
|---|---|---|
| **Auto Follow-up Bot** | Lead sin respuesta | Genera seguimiento programado automáticamente |
| **No Reply Bot** | Sin respuesta en 24h | Cambia estado a `esperando_respuesta`, notifica owner |
| **Reminder Bot** | `proximo_contacto_at` = ahora | Alerta push al owner para que actúe |
| **Sequence Bot** | Sin respuesta en 48h / 5d / 10d | Ejecuta secuencia de mensajes automática |
| **Re-activation Bot** | Sin respuesta en 30d | Mueve a `reactivacion_futura`, crea tarea en 30 días |
| **Proposal Reminder Bot** | Estado `propuesta_enviada` + 48h sin respuesta | Genera mensaje de seguimiento post-propuesta |
| **Meeting Reminder Bot** | Reunión agendada en < 2h | Envía recordatorio al lead y al owner |
| **Lost Lead Recovery Bot** | Estado `perdido` + 60 días | Intenta reactivación con nuevo ángulo |

---

## Capacidades IA del módulo

| Función IA | Descripción |
|---|---|
| **Resumen de conversación** | Resume la conversación completa en 3 líneas |
| **Próximo mensaje sugerido** | Propone el siguiente mensaje según contexto |
| **Draft de email** | Genera borrador de email personalizado |
| **Draft de WhatsApp** | Genera borrador de mensaje WhatsApp |
| **Clasificación de temperatura** | Califica la temperatura comercial automáticamente |
| **Detección de intención de compra** | Evalúa si hay intención real de contratar |
| **Detección de objeciones** | Identifica objeciones expresadas en la conversación |
| **Detección de urgencia** | Detecta si el lead necesita solución inmediata |
| **Recomendación de próximo paso** | Sugiere la acción más efectiva según contexto |

Toda ejecución IA debe registrar métricas de coste según `01-constitution-v1.md §7`.

---

## Relaciones con otros módulos

| Módulo | Relación |
|---|---|
| **Prospectos** | Recibe prospectos ya contactados (estado `contactado` en Prospectos → entra a Seguimiento) |
| **Campañas** | Recibe leads inbound captados post-primer-contacto del bot |
| **Pipeline** | Si hay interés real → se crea Deal en Pipeline (estado `negociacion`) |
| **Reuniones** | Si agenda → aparece en Reuniones con link al seguimiento |
| **Clientes** | Si cierra → estado `ganado` genera ficha en Clientes con atribución completa |

---

## Regla de negocio — Los 4 campos obligatorios

> Todo seguimiento dentro del módulo **debe tener siempre** estos 4 campos completos.  
> Si falta alguno → el sistema lo marca como **incompleto** y alerta al owner.

| # | Campo | Descripción |
|---|---|---|
| 1 | `owner_id` | Responsable asignado |
| 2 | `ultimo_contacto_at` | Último contacto registrado |
| 3 | `proximo_contacto_at` | Próxima acción definida con fecha |
| 4 | `estado` | Estado activo (nunca vacío) |

---

## Criterios de aceptación (DoD)

Para que esta spec se considere implementada:

- [ ] Vista de bandeja unificada con filtro por bandeja (Hoy / Vencidos / +24h / etc.)
- [ ] CRUD completo de seguimientos
- [ ] Validación de los 4 campos obligatorios — alerta visual si falta alguno
- [ ] KPIs del dashboard en tiempo real
- [ ] Transiciones de estado válidas implementadas y auditadas
- [ ] Historial de contactos por seguimiento (quién hizo qué y cuándo)
- [ ] Temperatura comercial clasificable (manual + IA)
- [ ] Secuencia automática de recontactos: 24h / 48h / 5d / 10d / 30d
- [ ] Resumen IA de conversación generado automáticamente
- [ ] Sugerencia de próximo mensaje por IA
- [ ] Exportar bandeja a CSV
- [ ] Notificaciones push al owner cuando hay pendientes
- [ ] Relación funcional bidireccional con Pipeline y Reuniones
- [ ] Métricas de coste IA registradas en cada ejecución

---

## Próximos pasos

1. Aprobar esta spec con el equipo
2. Crear `05-erp-004-comercial-pipeline.md`
3. Definir schema Prisma para entidad `Followup`
4. Diseñar endpoints REST (`/api/followups`)
5. Definir lógica de los 4 campos obligatorios en el backend (middleware de validación)
6. Especificar las secuencias de recontacto como workflows en el motor de automatización
