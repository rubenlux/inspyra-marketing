# ERP-007 — Delivery / Servicios

**Spec ID:** 08  
**Código:** ERP-007  
**Módulo:** Delivery → Servicios  
**Estado:** 🟡 DRAFT v1  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  

---

## Objetivo del módulo

El módulo Servicios administra todos los servicios vendidos por Inspyra a cada cliente.

Su función es estructurar, organizar, activar y mantener cada servicio contratado durante todo su ciclo de vida.

Es el **catálogo vivo operativo-comercial** de la relación cliente → servicio.

---

## Principio central

> **Cada servicio es una unidad operativa independiente.**

Aunque pertenezca al mismo cliente, cada servicio tiene:
- Alcance propio
- Estado propio
- Fechas propias
- Owner propio
- Facturación propia
- Entregables propios

---

## Qué resuelve

| Sin módulo Servicios | Con módulo Servicios |
|---|---|
| Confusión sobre qué compró el cliente | Claridad total de lo contratado |
| Difícil saber qué está incluido | Estado actual de cada servicio visible |
| Mala trazabilidad operativa | Responsables definidos |
| Problemas de facturación | Facturación vinculada |
| Difícil renovación | Renovaciones controladas |
| Desorden entre comercial y delivery | Visión completa por cliente |

---

## Qué vive dentro del módulo

Todo servicio vendido, activo o histórico:

| Categoría | Ejemplos |
|---|---|
| Web | Diseño web, landing page, tienda online |
| SEO | SEO mensual, SEO técnico, SEO local |
| Ads | Google Ads, Meta Ads, remarketing |
| Branding | Identidad visual, logo, brand book |
| Hosting | HostingGuard Managed Hosting |
| Cloud | Inspyra Cloud Infra, AWS workloads |
| Software | Desarrollo a medida, integraciones API |
| Email Marketing | Automatización, campañas, newsletters |
| Soporte | Mantenimiento técnico, soporte recurrente |
| Consultoría | Estrategia digital, consultoría técnica |

---

## Qué NO vive aquí

| ❌ No aquí | ✅ Dónde va |
|---|---|
| Prospectos | Módulo Prospectos |
| Campañas de captación internas | Módulo Campañas |
| Tareas aisladas sin servicio asociado | Módulo Tareas |
| Tickets individuales | Módulo Tickets |
| Reuniones comerciales | Módulo Reuniones |

---

## Flujo del ciclo de vida del servicio

```
Venta cerrada → Alta de servicio → Vinculación cliente → Asignación operativa → Ejecución → Seguimiento → Renovación / Cierre / Upgrade
```

### Paso 1 — Venta cerrada
Pipeline pasa a `ganado`. El `Service Creation Bot` actúa automáticamente.

### Paso 2 — Alta de servicio
Se crea el registro del servicio vendido con todos sus datos.

### Paso 3 — Vinculación al cliente
Se asocia a la ficha del cliente. Aparece en la pestaña Servicios.

### Paso 4 — Asignación operativa
Se define: owner principal, equipo, responsables internos.

### Paso 5 — Ejecución
Estado pasa a `activo` o `en_ejecucion`. Delivery comienza.

### Paso 6 — Seguimiento continuo
El servicio se monitorea mientras está activo: estado, entregables, SLA, facturación.

### Paso 7 — Renovación / Cierre / Upgrade

| Resultado | Acción |
|---|---|
| Renueva igual | `Renewal Bot` gestiona automáticamente |
| Upgrade (más servicios) | Crea nuevo servicio + oportunidad en Pipeline |
| Pausa temporal | Estado `pausado` con fecha de reanudación |
| Cancela | Estado `cancelado` con motivo obligatorio |
| Finaliza (puntual) | Estado `finalizado` con entregables cerrados |

---

## Modelo de datos

### Servicio (entidad principal)

#### Identificación

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único |
| `client_id` | uuid (FK Client) | Cliente al que pertenece |
| `nombre` | string | Nombre del servicio |
| `categoria` | enum | web / seo / ads / branding / hosting / cloud / software / email_mkt / soporte / consultoria |
| `descripcion_alcance` | text | Qué incluye exactamente el servicio |

#### Estado y fechas

| Campo | Tipo | Descripción |
|---|---|---|
| `estado` | enum | Ver estados posibles |
| `fecha_inicio` | date | Fecha de inicio del servicio |
| `fecha_fin` | date | Fecha de finalización (nullable si recurrente) |
| `duracion_estimada_dias` | int | Duración estimada en días (nullable si indefinido) |

#### Modelo económico

| Campo | Tipo | Descripción |
|---|---|---|
| `billing_model` | enum | unico / mensual / trimestral / anual / por_horas / por_proyecto / suscripcion |
| `precio_vendido_usd` | decimal | Precio acordado al cerrar la venta |
| `precio_actual_usd` | decimal | Precio vigente (puede actualizarse en renovaciones) |
| `coste_interno_usd` | decimal | Estimación de coste interno de producción |
| `margen_estimado_pct` | decimal (calculado) | ((precio - coste) / precio) × 100 |
| `mrr_usd` | decimal (calculado) | Aporte mensual al MRR (0 si es único pago) |

#### Operación

| Campo | Tipo | Descripción |
|---|---|---|
| `owner_id` | uuid (FK User) | Responsable principal del servicio |
| `equipo_ids` | uuid[] (FK Users) | Equipo asignado (array) |
| `entregables` | string[] | Lista de entregables esperados |
| `sla` | string | Descripción del SLA si aplica (nullable) |

#### Renovación

| Campo | Tipo | Descripción |
|---|---|---|
| `renovacion_automatica` | boolean | Si renueva automáticamente |
| `proxima_renovacion_at` | date | Fecha de próxima renovación (nullable) |
| `historial_renovaciones` | int (calculado) | Cantidad de renovaciones realizadas |

#### Origen y trazabilidad

| Campo | Tipo | Descripción |
|---|---|---|
| `deal_origen_id` | uuid (FK Deal) | Oportunidad de Pipeline que originó este servicio |
| `propuesta_origen_id` | uuid (FK) | Propuesta que cerró el servicio (nullable) |

#### Metadata

| Campo | Tipo | Descripción |
|---|---|---|
| `observaciones` | text | Notas internas del equipo |
| `motivo_cancelacion` | string | Obligatorio si estado = `cancelado` |
| `created_at` | timestamp | Fecha de creación |
| `updated_at` | timestamp | Última actualización |
| `created_by_id` | uuid (FK User) | Quién creó el registro |

---

### Entregable (entidad relacionada — uno a muchos)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `servicio_id` | uuid (FK) | Servicio al que pertenece |
| `nombre` | string | Descripción del entregable |
| `estado` | enum | pendiente / en_proceso / completado / aprobado / rechazado |
| `fecha_esperada` | date | Fecha límite de entrega |
| `fecha_entregado` | date | Fecha real de entrega (nullable) |
| `url_archivo` | string | Link al archivo / documento entregado (nullable) |
| `notas` | text | Observaciones del entregable |

---

## Catálogo de servicios (tabla de referencia)

Además de los servicios vendidos, el ERP mantiene un **catálogo interno** de servicios disponibles para facilitar la creación:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `nombre` | string | Nombre estándar del servicio |
| `categoria` | enum | Misma que Servicio |
| `descripcion_default` | text | Descripción base para nuevos contratos |
| `precio_base_usd` | decimal | Precio mínimo de referencia |
| `billing_model_default` | enum | Modelo de facturación más común |
| `activo` | boolean | Si está disponible para nueva venta |

---

## Estados posibles

| Estado | Descripción |
|---|---|
| `pendiente_activacion` | Vendido pero aún no iniciado |
| `onboarding` | En proceso de activación inicial |
| `activo` | Servicio en operación normal |
| `en_ejecucion` | Trabajo activo en curso (proyectos, entregas) |
| `en_revision` | Entregable enviado, esperando aprobación del cliente |
| `esperando_cliente` | Bloqueado esperando información o decisión del cliente |
| `pausado` | Temporalmente detenido con fecha de reanudación |
| `renovacion_pendiente` | Próximo a vencer, pendiente de renovación |
| `finalizado` | Completado exitosamente |
| `cancelado` | Cancelado (motivo obligatorio) |
| `archivado` | Histórico, no activo |

---

## KPIs del módulo

| KPI | Descripción | Cálculo |
|---|---|---|
| Servicios activos | Estados `activo` + `en_ejecucion` | COUNT |
| Nuevos este mes | `fecha_inicio` en el mes actual | COUNT |
| Renovaciones próximas | `proxima_renovacion_at` ≤ 30 días | COUNT |
| Servicios pausados | Estado `pausado` | COUNT |
| Servicios finalizados | Estado `finalizado` en el mes | COUNT |
| MRR por servicios | Suma `mrr_usd` de todos activos | SUM |
| Revenue total por categoría | Agrupado por `categoria` | SUM(precio_vendido) por grupo |
| Margen promedio | Promedio de `margen_estimado_pct` | AVG |
| Rentabilidad por línea | Comparativa categoría vs coste | Tabla cruzada |
| Servicios por cliente | Media de servicios activos por cliente | AVG |

---

## Bots y automatizaciones

| Bot | Trigger | Acción |
|---|---|---|
| **Service Creation Bot** | Deal pasa a `ganado` | Crea servicio desde datos del deal automáticamente |
| **Renewal Reminder Bot** | `proxima_renovacion_at` - 30 días | Notifica al owner + al account manager del cliente |
| **Expiration Bot** | `fecha_fin` alcanzada sin renovación | Cambia estado a `renovacion_pendiente` + alerta |
| **Margin Alert Bot** | `margen_estimado_pct` < umbral definido | Alerta al director con desglose de coste |
| **Upsell Bot** | Análisis mensual de categorías sin contratar | Detecta expansión posible + abre oportunidad en Pipeline |
| **SLA Monitor Bot** | Periódicamente en servicios con SLA activo | Verifica cumplimiento y alerta si hay riesgo de breach |
| **Lifecycle Bot** | Cambios de estado en Proyectos / Entregables | Actualiza estado del servicio automáticamente |

---

## Capacidades IA del módulo

| Función IA | Descripción |
|---|---|
| **Resumen ejecutivo del servicio** | Estado actual, avance, próximos pasos en 5 líneas |
| **Análisis de rentabilidad** | Comparativa precio vs coste vs tiempo invertido |
| **Detección de oportunidad upsell** | Identifica servicios complementarios no contratados |
| **Estimación de esfuerzo** | Estime horas/recursos necesarios para el servicio |
| **Predicción de renovación** | Probabilidad de que el cliente renueve |
| **Análisis churn por servicio** | Señales de riesgo de cancelación |
| **Resumen mensual de actividad** | Informe de lo realizado en el mes para el cliente |
| **Recomendación de expansión** | Basada en el perfil y sector del cliente |

Toda ejecución IA debe registrar métricas de coste según `01-constitution-v1.md §7`.

---

## Relaciones con otros módulos

| Módulo | Relación |
|---|---|
| **Clientes** | Todo servicio pertenece a un cliente (FK obligatorio) |
| **Proyectos** | Un servicio puede generar uno o varios proyectos de ejecución |
| **Finanzas** | Cada servicio genera facturación vinculada |
| **HostingGuard** | Servicio tipo `hosting` se vincula a servidor en HostingGuard |
| **Inspyra Cloud** | Servicio tipo `cloud` se vincula a proyecto en Inspyra Cloud |
| **Tickets** | Soporte operativo relacionado al servicio |
| **Laboratorio IA** | Si el servicio usa agentes IA o automatizaciones |

---

## Reglas críticas de negocio

### Regla 1 — Cliente obligatorio
Todo servicio debe tener `client_id` asignado. No puede existir servicio sin cliente.

### Regla 2 — Estado activo o histórico
Todo servicio debe tener siempre un estado definido. Nunca puede estar en estado nulo o indefinido.

### Regla 3 — Owner obligatorio
Todo servicio debe tener `owner_id` asignado antes de activarse.

### Regla 4 — Valor económico obligatorio
`precio_vendido_usd` y `billing_model` son obligatorios. Sin valor económico → servicio bloqueado.

### Regla 5 — Trazabilidad completa
`deal_origen_id` debe conservarse siempre. La cadena comercial no puede romperse.

### Regla 6 — Motivo al cancelar
`motivo_cancelacion` es obligatorio al pasar a estado `cancelado`. Sin motivo → transición bloqueada.

---

## Las 8 preguntas que debe poder responder el módulo

| Pregunta | Campo / Fuente |
|---|---|
| ¿Qué contrató este cliente? | Servicios filtrados por `client_id` |
| ¿Cuánto factura ese servicio? | `precio_actual_usd` + `billing_model` |
| ¿Quién lo gestiona? | `owner_id` + `equipo_ids` |
| ¿Cuál es su estado actual? | `estado` |
| ¿Qué entregables incluye? | `entregables` + tabla Entregable |
| ¿Cuándo renueva? | `proxima_renovacion_at` |
| ¿Cuánto margen deja? | `margen_estimado_pct` |
| ¿Qué oportunidad de expansión tiene? | Upsell Bot + `oportunidad_upsell` |

---

## Criterios de aceptación (DoD)

Para que esta spec se considere implementada:

- [ ] Alta automática de servicio desde evento `deal.won`
- [ ] CRUD completo de servicios con validaciones
- [ ] Catálogo interno de servicios disponibles para nueva venta
- [ ] Tabla de servicios con filtros (cliente, categoría, estado, owner, renovación)
- [ ] Entregables vinculados por servicio con estado y fechas
- [ ] KPIs del dashboard en tiempo real (especialmente MRR y margen)
- [ ] Vista de rentabilidad por categoría
- [ ] Validación de 5 campos obligatorios (client, owner, estado, precio, billing_model)
- [ ] Motivo de cancelación obligatorio al cancelar
- [ ] Renewal Reminder Bot con 30 días de anticipación
- [ ] Margin Alert Bot con umbral configurable
- [ ] Lifecycle Bot actualiza estado desde Proyectos
- [ ] Resumen IA del servicio disponible en la ficha
- [ ] Exportar servicios a CSV
- [ ] Historial de cambios de estado (auditoría)
- [ ] Métricas IA registradas por cada ejecución

---

## Próximos pasos

1. Aprobar esta spec con el equipo
2. Crear `09-erp-008-delivery-proyectos.md`
3. Definir schema Prisma para entidades `Service`, `ServiceDeliverable` y `ServiceCatalog`
4. Diseñar endpoints REST (`/api/services`, `/api/services/:id/deliverables`)
5. Definir el trigger `deal.won` que también crea el servicio (junto con el cliente)
6. Especificar el Margin Alert Bot con umbral configurable por categoría
