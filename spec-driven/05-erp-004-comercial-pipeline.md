# ERP-004 — Comercial / Pipeline

**Spec ID:** 05  
**Código:** ERP-004  
**Módulo:** Comercial → Pipeline  
**Estado:** 🟡 DRAFT v1  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  

---

## Objetivo del módulo

El módulo Pipeline administra el **embudo comercial completo** de Inspyra.

Su función es visualizar, ordenar, priorizar y proyectar todas las oportunidades comerciales activas desde el primer interés real hasta el cierre como cliente.

Es el **tablero principal de ventas** de la agencia.

---

## Qué resuelve

| Sin Pipeline | Con Pipeline |
|---|---|
| Oportunidades dispersas | Visibilidad completa de cada oportunidad |
| Difícil saber qué está por cerrar | Forecast comercial real |
| Pérdida de visibilidad comercial | Priorización de cierres |
| Forecast poco claro | Valor proyectado mensual |
| Imposible proyectar ventas | Control del embudo |
| Reuniones sin contexto | Detección rápida de cuellos de botella |
| Propuestas sin seguimiento visual | |

---

## Qué vive dentro del Pipeline

Oportunidades comerciales **reales** con intención de compra detectada.

Ya hubo interacción previa. Ya existe interés confirmado.

Puede venir desde:

| Origen | Tipo |
|---|---|
| Prospectos | Outbound calificado |
| Campañas | Inbound calificado |
| Seguimiento | Lead que mostró interés |
| Referidos | Recomendación directa |
| Reuniones comerciales | Post-discovery |
| Formularios | Lead con contexto |
| Recontactos | Lead reactivado |
| Upsell clientes actuales | Expansión de cuenta |

---

## Qué NO vive aquí

| ❌ No aquí | ✅ Dónde va |
|---|---|
| Prospectos sin contactar | Módulo Prospectos |
| Leads nuevos sin calificar | Módulo Campañas / Seguimiento |
| Campañas activas | Módulo Campañas |
| Clientes ya cerrados | Módulo Clientes |

---

## Principio central

> **Toda oportunidad debe moverse.**

Ninguna oportunidad puede quedar detenida indefinidamente. Cada oportunidad debe:
- Avanzar de etapa
- Cerrarse (ganada o perdida)
- Pausarse con fecha de revisión
- Perderse con motivo registrado

**Nunca quedar abandonada.**

---

## Vista principal

**Kanban horizontal con Drag & Drop entre etapas.**

Cada card representa una oportunidad y muestra:

- Empresa y contacto principal
- Servicio de interés
- Valor estimado (USD)
- Días en etapa actual
- Temperatura comercial
- Owner asignado
- Próxima acción + fecha

---

## Etapas del pipeline

| # | Etapa | Descripción | Alerta si > |
|---|---|---|---|
| 1 | **Nuevo ingreso** | Lead calificado recién incorporado | 3 días |
| 2 | **Contactado** | Primer contacto realizado | 5 días |
| 3 | **Descubrimiento** | Entendiendo necesidad del prospecto | 7 días |
| 4 | **Reunión agendada** | Tiene reunión comercial confirmada | 5 días |
| 5 | **Reunión realizada** | Discovery o llamada comercial ejecutada | 5 días |
| 6 | **Propuesta en preparación** | Armando propuesta comercial | 5 días |
| 7 | **Propuesta enviada** | Cliente recibió propuesta | 7 días |
| 8 | **Negociación** | Negociando alcance, precio o condiciones | 10 días |
| 9 | **Cierre pendiente** | Muy cerca de cerrar, falta confirmación | 5 días |
| 10 | **Ganado** | Cliente convertido ✅ | — |
| 11 | **Perdido** | No avanzó ❌ | — |
| 12 | **Pausado** | Pendiente para retomar | 30 días |

---

## Modelo de datos

### Oportunidad (entidad principal)

#### Identificación y empresa

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único |
| `empresa` | string | Nombre de la empresa |
| `contacto_nombre` | string | Nombre del contacto principal |
| `contacto_email` | string | Email del contacto |
| `contacto_telefono` | string | Teléfono del contacto |

#### Comercial

| Campo | Tipo | Descripción |
|---|---|---|
| `servicio_interes` | enum | web / seo / ads / branding / hosting / software / email_mkt / cloud_infra / otro |
| `valor_estimado_usd` | decimal | Monto potencial proyectado |
| `probabilidad_cierre` | int (0–100) | % probabilidad de cierre |
| `fecha_estimada_cierre` | date | Fecha esperada de cierre |
| `owner_id` | uuid (FK User) | Comercial responsable |
| `fuente_origen` | enum | prospects / campaigns / followup / referral / meetings / upsell / form |

#### Estado y temperatura

| Campo | Tipo | Valores posibles |
|---|---|---|
| `etapa` | enum | nuevo_ingreso / contactado / descubrimiento / reunion_agendada / reunion_realizada / propuesta_preparacion / propuesta_enviada / negociacion / cierre_pendiente / ganado / perdido / pausado |
| `temperatura` | enum | fria / tibia / caliente |
| `urgencia` | enum | baja / media / alta / urgente |
| `dias_en_etapa` | int (calculado) | Días sin movimiento en la etapa actual |
| `estancada` | boolean (calculado) | True si supera el umbral de días de su etapa |

#### Actividad y seguimiento

| Campo | Tipo | Descripción |
|---|---|---|
| `ultimo_movimiento_at` | timestamp | Fecha del último cambio de etapa |
| `proxima_accion` | string | Descripción de la próxima acción |
| `proxima_accion_at` | timestamp | Fecha de la próxima acción |

#### Relaciones

| Campo | Tipo | Descripción |
|---|---|---|
| `propuesta_id` | uuid (FK) | Propuesta asociada (nullable) |
| `reunion_id` | uuid (FK) | Reunión asociada (nullable) |
| `prospect_id` | uuid (FK) | Prospecto origen (nullable) |
| `lead_id` | uuid (FK) | Lead inbound origen (nullable) |
| `followup_id` | uuid (FK) | Seguimiento asociado (nullable) |
| `cliente_id` | uuid (FK) | Cliente generado al ganar (nullable) |

#### Cierre

| Campo | Tipo | Descripción |
|---|---|---|
| `motivo_perdida` | enum | precio / timing / sin_respuesta / competencia / presupuesto_bajo / cancelado / decision_interna / otro |
| `nota_cierre` | text | Detalle libre del resultado |
| `fecha_cierre_real` | date | Fecha real de cierre (ganado o perdido) |

#### Metadata y IA

| Campo | Tipo | Descripción |
|---|---|---|
| `notas_internas` | text | Notas libres del equipo |
| `resumen_ia` | text | Resumen automático del estado comercial generado por IA |
| `riesgo_perdida_ia` | enum | bajo / medio / alto (calculado por IA) |
| `created_at` | timestamp | Fecha de creación |
| `updated_at` | timestamp | Última actualización |

---

### Historial de etapas (entidad de auditoría)

Registra cada movimiento de etapa para trazabilidad total:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `oportunidad_id` | uuid (FK) | Oportunidad asociada |
| `etapa_anterior` | enum | Etapa de origen |
| `etapa_nueva` | enum | Etapa destino |
| `movido_por_id` | uuid (FK User) | Usuario o bot que realizó el movimiento |
| `movido_por_tipo` | enum | human / bot |
| `nota` | string | Comentario del movimiento (opcional) |
| `created_at` | timestamp | Fecha del movimiento |

---

## KPIs del módulo

| KPI | Descripción | Cálculo |
|---|---|---|
| Total oportunidades activas | Excluyendo ganado / perdido / pausado | COUNT(activas) |
| Valor total pipeline | Suma de `valor_estimado_usd` activos | SUM(valor) |
| Forecast mensual | Valor × probabilidad de oportunidades con cierre este mes | SUM(valor × prob) |
| Forecast trimestral | Ídem para este trimestre | SUM(valor × prob) |
| Ticket promedio | Valor medio de las oportunidades | AVG(valor) |
| Ratio de cierre | Ganadas / (Ganadas + Perdidas) × 100 | % |
| Tiempo promedio de cierre | Días promedio desde ingreso hasta `ganado` | AVG(días) |
| Oportunidades calientes | Temperatura `caliente` + estado activo | COUNT |
| Oportunidades estancadas | `estancada = true` | COUNT + alerta |
| Ganadas este mes | Cerradas como `ganado` en el mes actual | COUNT + SUM(valor) |
| Perdidas este mes | Cerradas como `perdido` en el mes actual | COUNT + motivos agrupados |

---

## Bots y automatizaciones

| Bot / Automatización | Trigger | Acción |
|---|---|---|
| **Stage Movement Bot** | Lead en Seguimiento avanza de estado | Mueve oportunidad a siguiente etapa automáticamente |
| **Stalled Opportunity Bot** | `dias_en_etapa` supera umbral de la etapa | Alerta al owner + marca `estancada = true` |
| **Forecast Bot** | Diariamente a las 08:00 | Recalcula forecast mensual y trimestral |
| **Proposal Follow-up Bot** | Estado `propuesta_enviada` + 48h sin respuesta | Genera tarea de seguimiento + draft de mensaje |
| **Deal Probability Bot** | Cambio de etapa / nuevo movimiento | Recalcula `probabilidad_cierre` según comportamiento histórico |
| **Lost Opportunity Recovery Bot** | Estado `perdido` + 90 días | Intenta reactivación si el motivo no es definitivo |
| **Upsell Detection Bot** | Cliente activo + servicio complementario sin contratar | Crea oportunidad nueva en Pipeline como upsell |

---

## Capacidades IA del módulo

| Función IA | Descripción |
|---|---|
| **Resumen estado comercial** | Estado actual de la oportunidad en 3 líneas |
| **Detección de objeciones** | Identifica objeciones en notas y conversaciones |
| **Probabilidad de cierre IA** | Calcula % de cierre por patrones de comportamiento |
| **Próximo paso sugerido** | Recomienda la acción más efectiva |
| **Detección de riesgo de pérdida** | Señales de enfriamiento o desinterés |
| **Proyección de revenue** | Forecast probable con rangos de confianza |
| **Recomendación de oferta** | Sugiere ajuste de propuesta para aumentar chances |

Toda ejecución IA debe registrar métricas de coste según `01-constitution-v1.md §7`.

---

## Relaciones con otros módulos

| Módulo | Relación |
|---|---|
| **Prospectos** | Origen inicial outbound → Pipeline cuando hay interés real |
| **Campañas** | Origen inbound → Pipeline cuando lead califica |
| **Seguimiento** | Opera en paralelo — Pipeline es la vista estratégica, Seguimiento es la operativa diaria |
| **Reuniones** | Cada oportunidad puede tener N reuniones asociadas |
| **Finanzas** | `ganado` → genera revenue proyectado y futura facturación |
| **Clientes** | `ganado` → trigger automático crea ficha de Cliente |

---

## Reglas críticas de negocio

### Regla 1 — Owner obligatorio
Toda oportunidad debe tener `owner_id` asignado. Sin owner → el sistema bloquea el guardado.

### Regla 2 — Próxima acción obligatoria
Toda oportunidad activa debe tener `proxima_accion` y `proxima_accion_at` definidos.

### Regla 3 — Fecha próxima obligatoria
Sin fecha de próxima acción → alerta visual al owner hasta completarla.

### Regla 4 — Alerta por estancamiento
Oportunidad sin movimiento más de X días (según etapa) → `estancada = true` + notificación push al owner.

### Regla 5 — Auto-onboarding al ganar
Cuando se mueve a `ganado`, el sistema crea automáticamente:

| Acción | Módulo |
|---|---|
| Ficha de Cliente | Módulo Clientes |
| Servicio vendido registrado | Módulo Servicios |
| Proyecto inicial creado | Módulo Proyectos |
| Tarea de onboarding asignada | Módulo Tareas |
| Notificación al equipo de Delivery | Interno |

### Regla 6 — Motivo obligatorio al perder
Cuando se mueve a `perdido`, el campo `motivo_perdida` es obligatorio.

| Motivo | Código |
|---|---|
| Precio demasiado alto | `precio` |
| Mal timing del cliente | `timing` |
| No respondió | `sin_respuesta` |
| Eligió a la competencia | `competencia` |
| Presupuesto insuficiente | `presupuesto_bajo` |
| Canceló proyecto | `cancelado` |
| Decisión interna del prospecto | `decision_interna` |
| Otro | `otro` (requiere nota) |

---

## Objetivo estratégico — Las 4 preguntas del Pipeline

El módulo debe poder responder siempre estas preguntas en tiempo real:

| Pregunta | Fuente de datos |
|---|---|
| ¿Qué está por cerrar esta semana? | Etapa `cierre_pendiente` + `fecha_estimada_cierre` ≤ 7 días |
| ¿Qué revenue probable tenemos este mes? | Forecast mensual (valor × probabilidad) |
| ¿Qué oportunidades necesitan atención urgente? | `estancada = true` + temperatura `caliente` |
| ¿Qué negocios estamos perdiendo y por qué? | Agrupación de `motivo_perdida` del período |

---

## Criterios de aceptación (DoD)

Para que esta spec se considere implementada:

- [ ] Vista Kanban con las 12 etapas y drag & drop funcional
- [ ] Vista lista alternativa con todos los campos
- [ ] Validación de los 3 campos obligatorios (owner, próxima acción, fecha)
- [ ] Alerta visual de oportunidades estancadas según umbral por etapa
- [ ] KPIs del dashboard en tiempo real (especialmente Forecast mensual)
- [ ] Historial de etapas auditado por oportunidad
- [ ] Auto-onboarding al pasar a `ganado` (crea Cliente + Proyecto + Tarea)
- [ ] Motivo de pérdida obligatorio al pasar a `perdido`
- [ ] Forecast mensual y trimestral calculados correctamente
- [ ] Ratio de cierre y tiempo promedio calculados
- [ ] Deal Probability Bot recalcula probabilidad en cada movimiento
- [ ] Stalled Opportunity Bot con alertas por etapa
- [ ] Resumen IA y riesgo de pérdida generados automáticamente
- [ ] Exportar pipeline a CSV / Excel
- [ ] Notificaciones push para oportunidades sin acción futura
- [ ] Relación bidireccional con Clientes (ganado → auto-crea ficha)

---

## Próximos pasos

1. Aprobar esta spec con el equipo
2. Crear `06-erp-005-comercial-reuniones.md`
3. Definir schema Prisma para entidades `Deal` y `DealStageHistory`
4. Diseñar endpoints REST (`/api/deals`)
5. Definir el trigger de auto-onboarding en el backend (evento `deal.won`)
6. Especificar la lógica del Forecast Bot como servicio calculado
