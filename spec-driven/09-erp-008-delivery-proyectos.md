# ERP-008 — Delivery / Proyectos

**Spec ID:** 09  
**Código:** ERP-008  
**Módulo:** Delivery → Proyectos  
**Estado:** 🟡 DRAFT v1  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  

---

## Objetivo del módulo

El módulo Proyectos administra la ejecución completa de los trabajos vendidos por Inspyra.

Su función es planificar, organizar, ejecutar, controlar y entregar cada proyecto asociado a uno o más servicios contratados por un cliente.

Es el **centro operativo de delivery** de la agencia.

---

## Principio central

> **Cada proyecto representa una ejecución concreta para un cliente.**

Un cliente puede tener múltiples proyectos activos al mismo tiempo.

Cada proyecto tiene: objetivo · alcance · responsables · tareas · archivos · tiempos · estado · entregables.

---

## Qué resuelve

| Sin módulo Proyectos | Con módulo Proyectos |
|---|---|
| Tareas dispersas sin contexto | Roadmap claro y centralizado |
| Poca claridad operativa | Responsables definidos |
| Entregas fuera de fecha | Hitos y deadlines controlados |
| Desorden entre equipos | Avance medible en tiempo real |
| Falta de responsables claros | Documentación centralizada |
| Mala trazabilidad con cliente | Ejecución trazable de punta a punta |

---

## Qué vive dentro del módulo

Todos los trabajos activos o históricos ejecutados para clientes:

| Tipo | Ejemplos |
|---|---|
| Web | Rediseño web completo, landing page, tienda online |
| SEO | Setup SEO técnico, optimización performance |
| Branding | Identidad visual, logo, brand book |
| Software | Sistema interno a medida, integración API |
| Cloud | Migración AWS, implementación cloud infra |
| Hosting | Implementación HostingGuard, migración servidor |
| Email | Configuración mail profesional, setup automation |
| Automatización | Workflows, bots, integraciones entre plataformas |
| IA Lab | Agentes, pipelines IA, automatizaciones avanzadas |

---

## Qué NO vive aquí

| ❌ No aquí | ✅ Dónde va |
|---|---|
| Leads / prospectos | Módulo Prospectos |
| Campañas de captación | Módulo Campañas |
| Oportunidades comerciales | Módulo Pipeline |
| Facturas y pagos | Módulo Finanzas |

---

## Flujo del ciclo de vida del proyecto

```
Servicio activado → Creación proyecto → Asignación equipo → Planificación → Producción → Revisión → Entrega → Cierre
```

### Paso 1 — Servicio activado
El cliente tiene un servicio en estado `activo` o `en_ejecucion` en el módulo Servicios.

### Paso 2 — Creación del proyecto
Manual por el equipo o automática vía **Project Creation Bot** según el tipo de servicio.

### Paso 3 — Asignación de equipo

| Rol | Área |
|---|---|
| Dirección | Visión y aprobaciones |
| Diseño | UI/UX, gráfica |
| Desarrollo | Frontend, backend, mobile |
| SEO | Técnico y contenido |
| Ads | Campañas pagas |
| Contenido | Copywriting, video |
| Cloud | Infra, DevOps |
| Automatización | Bots, integraciones |
| IA | Agentes, pipelines |

### Paso 4 — Planificación
Definición de: alcance, qué no incluye, roadmap, hitos, deadlines, entregables.

### Paso 5 — Producción
Ejecución diaria. Tareas asignadas por sprint o flujo continuo.

### Paso 6 — Revisión
QA interno → aprobación del cliente.

### Paso 7 — Entrega
Parcial (hito) o final. Se registra fecha real de entrega.

### Paso 8 — Cierre o continuidad

| Resultado | Acción |
|---|---|
| Proyecto puntual completado | Estado `finalizado` |
| Proyecto continúa con nueva fase | Se crea nuevo hito o sprint |
| Cancelado | Estado `cancelado` + motivo obligatorio |
| Evoluciona a mantenimiento | Genera nuevo servicio recurrente |

---

## Modelo de datos

### Proyecto (entidad principal)

#### Identificación

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único |
| `nombre` | string | Nombre del proyecto |
| `tipo` | enum | web / seo / branding / software / cloud / hosting / email / automatizacion / ia_lab / otro |
| `descripcion` | text | Descripción general del trabajo |
| `objetivo` | text | Qué resultado espera lograr este proyecto |

#### Alcance

| Campo | Tipo | Descripción |
|---|---|---|
| `alcance` | text | Qué está incluido explícitamente |
| `fuera_de_alcance` | text | Qué NO está incluido — **campo crítico** |
| `entregables_esperados` | string[] | Lista de entregables a producir |

#### Relaciones

| Campo | Tipo | Descripción |
|---|---|---|
| `client_id` | uuid (FK Client) | Cliente al que pertenece |
| `service_ids` | uuid[] (FK Services) | Servicios que originan este proyecto (uno o más) |
| `owner_id` | uuid (FK User) | Responsable principal del proyecto |
| `equipo_ids` | uuid[] (FK Users) | Equipo completo asignado |

#### Tiempos

| Campo | Tipo | Descripción |
|---|---|---|
| `fecha_inicio` | date | Fecha de inicio del proyecto |
| `fecha_deadline` | date | Fecha límite comprometida |
| `fecha_entrega_estimada` | date | Estimación interna realista |
| `fecha_entrega_real` | date | Fecha real de entrega (nullable) |
| `horas_estimadas` | decimal | Horas previstas de trabajo |
| `horas_consumidas` | decimal (calculado) | Horas reales acumuladas desde TimeEntries |

#### Estado y prioridad

| Campo | Tipo | Descripción |
|---|---|---|
| `estado` | enum | Ver estados posibles |
| `prioridad` | enum | baja / media / alta / urgente / critica |
| `porcentaje_avance` | int (0–100, calculado) | % calculado desde tareas completadas |
| `en_riesgo` | boolean (calculado) | True si hay señales de retraso |

#### Economía

| Campo | Tipo | Descripción |
|---|---|---|
| `coste_interno_estimado_usd` | decimal | Estimación de coste de producción |
| `coste_interno_real_usd` | decimal (calculado) | Coste real según horas consumidas × tarifa interna |
| `rentabilidad_estimada_pct` | decimal (calculado) | (precio_servicio - coste_estimado) / precio_servicio × 100 |

#### Links y documentación

| Campo | Tipo | Descripción |
|---|---|---|
| `links_externos` | jsonb | `{ figma, github, staging, produccion, drive }` (extensible) |
| `notas_internas` | text | Notas del equipo de Inspyra |
| `notas_cliente` | text | Notas comunicadas al cliente |
| `motivo_cancelacion` | string | Obligatorio si estado = `cancelado` |

#### Metadata

| Campo | Tipo | Descripción |
|---|---|---|
| `created_at` | timestamp | Fecha de creación |
| `updated_at` | timestamp | Última actualización |
| `created_by_id` | uuid (FK User) | Quién creó el proyecto |

---

### Hito (entidad relacionada — uno a muchos)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `project_id` | uuid (FK) | Proyecto al que pertenece |
| `nombre` | string | Nombre del hito (ej: "Diseño aprobado", "Deploy en producción") |
| `descripcion` | text | Qué debe estar listo para este hito |
| `fecha_objetivo` | date | Fecha objetivo del hito |
| `fecha_completado` | date | Fecha real de completado (nullable) |
| `estado` | enum | pendiente / en_progreso / completado / retrasado |
| `orden` | int | Posición en el roadmap |

---

### Time Entry (registro de tiempo — uno a muchos)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `project_id` | uuid (FK) | Proyecto asociado |
| `task_id` | uuid (FK Task) | Tarea asociada (nullable) |
| `user_id` | uuid (FK User) | Persona que registró el tiempo |
| `horas` | decimal | Horas trabajadas |
| `descripcion` | string | Qué se hizo en ese tiempo |
| `fecha` | date | Fecha del trabajo |

---

## Estados posibles

| Estado | Descripción |
|---|---|
| `pendiente` | Creado, sin iniciar |
| `planificacion` | Definiendo alcance y roadmap |
| `onboarding` | Kickoff y briefing con el cliente |
| `en_ejecucion` | Producción activa |
| `en_revision` | Entregable bajo revisión interna (QA) |
| `esperando_feedback` | Esperando respuesta o aprobación del cliente |
| `bloqueado` | Detenido por dependencia externa o interna |
| `pausado` | Pausado con fecha de reanudación |
| `qa_interno` | Revisión de calidad antes de entrega |
| `entregado` | Entregado al cliente, pendiente confirmación final |
| `finalizado` | Completado y aprobado |
| `cancelado` | Cancelado (motivo obligatorio) |
| `archivado` | Histórico, cerrado |

---

## Vistas disponibles

| Vista | Descripción |
|---|---|
| **Tablero** | Cards por proyecto agrupadas por estado |
| **Lista** | Tabla general con todos los campos y filtros |
| **Timeline** | Roadmap cronológico con hitos y deadlines |
| **Calendario** | Fechas, deadlines y entregas en formato calendario |
| **Carga de equipo** | Quién está trabajando en qué y cuántas horas |

---

## KPIs del módulo

| KPI | Descripción | Cálculo |
|---|---|---|
| Proyectos activos | Estados `en_ejecucion` + `en_revision` + `esperando_feedback` | COUNT |
| Proyectos en riesgo | `en_riesgo = true` | COUNT |
| Próximos vencimientos | `fecha_deadline` ≤ 7 días | COUNT |
| Proyectos retrasados | `fecha_entrega_real > fecha_deadline` o `en_riesgo` con deadline pasado | COUNT |
| Entregados este mes | Estado `finalizado` en el mes actual | COUNT |
| Horas estimadas vs reales | Comparativa global | SUM(estimadas) vs SUM(consumidas) |
| Rentabilidad por proyecto | `rentabilidad_estimada_pct` agrupada | AVG + ranking |
| Carga operativa del equipo | Horas activas por persona esta semana | SUM por user |
| Tiempo promedio de entrega | Días desde `fecha_inicio` hasta `fecha_entrega_real` | AVG |
| % cumplimiento de deadlines | Finalizados a tiempo / total finalizados | % |

---

## Bots y automatizaciones

| Bot | Trigger | Acción |
|---|---|---|
| **Project Creation Bot** | Servicio pasa a `activo` | Crea proyecto desde plantilla del tipo de servicio |
| **Deadline Alert Bot** | `fecha_deadline` - 7 días y - 2 días | Notificación push al owner + equipo |
| **Blocker Detection Bot** | Estado `bloqueado` + 24h sin cambio | Escala alerta al director del proyecto |
| **Progress Tracking Bot** | Cambio de estado en Tareas | Recalcula `porcentaje_avance` automáticamente |
| **Team Load Bot** | Semanal | Detecta miembros con sobrecarga (> X horas) y alerta al owner |
| **Delivery Reminder Bot** | Proyecto en estado `en_revision` + 3 días | Recuerda al equipo que hay entrega pendiente |
| **Client Feedback Reminder Bot** | Estado `esperando_feedback` + 48h | Envía recordatorio al cliente via email/WhatsApp |
| **Closure Bot** | Todos los hitos = `completado` | Propone pasar el proyecto a `finalizado` |

---

## Capacidades IA del módulo

| Función IA | Descripción |
|---|---|
| **Resumen de estado del proyecto** | Estado actual, avance, bloqueos en 5 líneas |
| **Detección de bloqueos** | Identifica dependencias o tareas detenidas |
| **Estimación de riesgo de retraso** | Predice probabilidad de no cumplir deadline |
| **Siguiente paso operativo** | Sugiere la próxima acción más crítica |
| **Generación de brief técnico** | Draft de documento de alcance y especificaciones |
| **Resumen de feedback cliente** | Consolida comentarios del cliente en puntos accionables |
| **Organización de backlog** | Prioriza tareas según impacto y urgencia |
| **Resumen de reuniones del proyecto** | Extrae acuerdos y próximos pasos de las reuniones vinculadas |

Toda ejecución IA debe registrar métricas de coste según `01-constitution-v1.md §7`.

---

## Relaciones con otros módulos

| Módulo | Relación |
|---|---|
| **Clientes** | Todo proyecto pertenece a un cliente (`client_id` obligatorio) |
| **Servicios** | Nace desde uno o más servicios contratados |
| **Tareas** | Cada proyecto contiene múltiples tareas (siguiente spec) |
| **HostingGuard** | Proyectos tipo `hosting` / `cloud` se vinculan a infraestructura |
| **Inspyra Cloud** | Proyectos tipo `cloud` se vinculan a proyecto cloud del cliente |
| **Finanzas** | Horas consumidas × tarifa interna impactan rentabilidad |
| **Laboratorio IA** | Puede ejecutar agentes o automatizaciones dentro del proyecto |

---

## Reglas críticas de negocio

### Regla 1 — Owner obligatorio
Todo proyecto debe tener `owner_id` asignado. Sin owner → bloqueo de creación.

### Regla 2 — Cliente asociado obligatorio
`client_id` es obligatorio y no puede modificarse una vez creado.

### Regla 3 — Deadline obligatorio
Todo proyecto debe tener `fecha_deadline`. Sin fecha → no puede pasar a `en_ejecucion`.

### Regla 4 — Estado siempre visible
El estado debe actualizarse antes del fin de cada día hábil en proyectos activos.

### Regla 5 — Avance medible
`porcentaje_avance` se calcula automáticamente desde las tareas. Nunca se edita manual.

### Regla 6 — Historial completo
Todos los cambios de estado, tiempos registrados y hitos quedan en audit trail permanente.

### Regla 7 — Fuera de alcance explícito
`fuera_de_alcance` es obligatorio al crear el proyecto. Define claramente qué no se hará para proteger al equipo y al cliente.

---

## Las 8 preguntas estratégicas del módulo

| Pregunta | Campo / Fuente |
|---|---|
| ¿Qué estamos haciendo para este cliente? | Proyectos filtrados por `client_id` en estado activo |
| ¿Quién está trabajando en ello? | `equipo_ids` + Time Entries de la semana |
| ¿Qué falta entregar? | `entregables_esperados` vs entregables completados |
| ¿Qué está retrasado? | `en_riesgo = true` + `fecha_deadline` vencida |
| ¿Qué se entrega esta semana? | `fecha_deadline` o hito ≤ 7 días |
| ¿Qué proyectos están bloqueados? | Estado `bloqueado` |
| ¿Cuánto tiempo llevamos invertido? | SUM(`horas_consumidas`) por proyecto |
| ¿Qué rentabilidad deja? | `rentabilidad_estimada_pct` |

---

## Criterios de aceptación (DoD)

Para que esta spec se considere implementada:

- [ ] Creación de proyecto (manual y automática desde servicio)
- [ ] Las 5 vistas: tablero, lista, timeline, calendario, carga de equipo
- [ ] Hitos vinculados al proyecto con estado y fechas
- [ ] Registro de tiempo (Time Entries) por tarea y por usuario
- [ ] `porcentaje_avance` calculado automáticamente desde tareas
- [ ] `en_riesgo` calculado automáticamente (deadline próximo + avance bajo)
- [ ] KPIs del dashboard en tiempo real
- [ ] Validación: owner, cliente, deadline, fuera_de_alcance obligatorios
- [ ] `fuera_de_alcance` obligatorio al crear
- [ ] Motivo de cancelación obligatorio al cancelar
- [ ] Deadline Alert Bot activo (7 días y 2 días antes)
- [ ] Client Feedback Reminder Bot (48h esperando cliente)
- [ ] Progress Tracking Bot actualiza avance desde tareas
- [ ] Resumen IA del estado del proyecto
- [ ] Estimación de riesgo de retraso por IA
- [ ] Links externos configurables (Figma, GitHub, staging, etc.)
- [ ] Historial completo de cambios de estado (auditoría)
- [ ] Exportar proyectos a CSV
- [ ] Métricas IA registradas por cada ejecución

---

## Próximos pasos

1. Aprobar esta spec con el equipo
2. Crear `10-erp-009-delivery-tareas.md` — **cierra el módulo Delivery**
3. Definir schema Prisma para entidades `Project`, `Milestone` y `TimeEntry`
4. Diseñar endpoints REST (`/api/projects`, `/api/projects/:id/milestones`, `/api/projects/:id/time-entries`)
5. Definir la lógica de cálculo de `porcentaje_avance` (tareas completadas / total tareas × 100)
6. Especificar la lógica de `en_riesgo`: deadline ≤ X días AND porcentaje_avance < umbral esperado
