# ERP-009 — Delivery / Tareas

**Spec ID:** 10  
**Código:** ERP-009  
**Módulo:** Delivery → Tareas  
**Estado:** 🟡 DRAFT v1  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  

---

## Objetivo del módulo

El módulo Tareas administra toda la ejecución operativa diaria del equipo Inspyra.

Su función es transformar proyectos y servicios en acciones concretas asignables, medibles y trazables.

Es el **sistema de ejecución diaria** del ERP.

---

## Principio central

> **Toda acción operativa debe convertirse en tarea.**

Nada puede quedar solo como mensaje, nota, reunión, comentario, WhatsApp o idea verbal.

Si requiere ejecución → debe ser una tarea en el ERP.

---

## Qué resuelve

| Sin módulo Tareas | Con módulo Tareas |
|---|---|
| Trabajo disperso en chats | Claridad diaria de trabajo |
| Pedidos que se pierden | Responsables visibles |
| Prioridades poco claras | Deadlines definidos |
| Tareas olvidadas | Prioridades ordenadas |
| Bloqueos invisibles | Bloqueos detectables |
| Sobrecarga desigual | Control de carga del equipo |

---

## Qué vive dentro del módulo

Toda unidad concreta de trabajo ejecutable:

| Área | Ejemplos |
|---|---|
| Diseño | Diseñar homepage, crear landing, ajustar branding |
| Desarrollo | Desplegar app, corregir bug, configurar VPS |
| SEO | Optimizar velocidad, ajustar SEO técnico, instalar SSL |
| Ads | Publicar campaña Meta Ads, revisar copy |
| Cloud | Migrar emails, configurar infraestructura |
| Contenido | Escribir secuencia email marketing |
| Soporte | Responder ticket cliente |
| Comercial | Revisar propuesta, preparar briefing |

---

## Qué NO vive aquí

| ❌ No aquí | ✅ Dónde va |
|---|---|
| Proyectos completos | Módulo Proyectos |
| Fichas de clientes | Módulo Clientes |
| Oportunidades comerciales | Módulo Pipeline |
| Campañas como entidad | Módulo Campañas |
| Facturas y pagos | Módulo Finanzas |

---

## Flujo del ciclo de vida de una tarea

```
Nace → Asignación → Priorización → Ejecución → Revisión → Cierre
```

### Paso 1 — La tarea nace

Puede crearse desde:

| Origen | Cómo |
|---|---|
| Proyecto | Al crear hitos o sub-trabajos |
| Servicio | Al activar un servicio (tareas de onboarding) |
| Cliente | Solicitud directa del cliente |
| Ticket | Al resolver un ticket de soporte |
| Reunión | Post-meeting action items (generados por IA o manual) |
| Seguimiento | Acción pendiente de un lead |
| Automatización | Bot o agente IA crea la tarea |
| Manual | Cualquier miembro del equipo |

### Paso 2 — Asignación
Se define `owner_id` responsable principal. Puede incluir colaboradores.

### Paso 3 — Priorización
Se define prioridad y deadline. Puede vincularse a un proyecto o quedar como tarea suelta.

### Paso 4 — Ejecución
El responsable trabaja. Registra tiempo opcionalmente.

### Paso 5 — Revisión
Si la tarea lo requiere, pasa a `en_revision` antes de completarse.

### Paso 6 — Cierre
Se marca como `completada` con fecha real de cierre registrada automáticamente.

---

## Modelo de datos

### Tarea (entidad principal)

#### Identificación y contexto

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único |
| `titulo` | string | Título corto y accionable (empezar con verbo: "Diseñar", "Configurar", "Revisar") |
| `descripcion` | text | Detalle de qué se necesita hacer y cómo |

#### Relaciones (todas opcionales excepto owner)

| Campo | Tipo | Descripción |
|---|---|---|
| `project_id` | uuid (FK Project) | Proyecto al que pertenece (nullable — puede ser tarea suelta) |
| `service_id` | uuid (FK Service) | Servicio asociado (nullable) |
| `client_id` | uuid (FK Client) | Cliente asociado (nullable) |
| `ticket_id` | uuid (FK Ticket) | Ticket de soporte origen (nullable) |
| `parent_task_id` | uuid (FK Task) | Tarea padre si es subtarea (nullable) |

#### Responsabilidad

| Campo | Tipo | Descripción |
|---|---|---|
| `owner_id` | uuid (FK User) | Responsable principal — **obligatorio** |
| `collaborator_ids` | uuid[] (FK Users) | Colaboradores adicionales |
| `created_by_id` | uuid (FK User) | Quién creó la tarea |

#### Clasificación

| Campo | Tipo | Descripción |
|---|---|---|
| `prioridad` | enum | baja / media / alta / urgente / critica |
| `estado` | enum | Ver estados posibles |
| `etiquetas` | string[] | Tags libres: diseño, desarrollo, seo, ads, soporte, cloud, contenido, etc. |
| `area` | enum | diseño / desarrollo / seo / ads / cloud / contenido / soporte / comercial / ia / otro |

#### Tiempos

| Campo | Tipo | Descripción |
|---|---|---|
| `fecha_inicio` | date | Fecha de inicio prevista |
| `deadline` | date | Fecha límite de entrega |
| `fecha_cierre_real` | date (calculado) | Se registra automáticamente al completar |
| `tiempo_estimado_horas` | decimal | Horas previstas |
| `tiempo_real_horas` | decimal (calculado) | Suma de TimeEntries vinculadas a esta tarea |

#### Bloqueos y dependencias

| Campo | Tipo | Descripción |
|---|---|---|
| `bloqueada` | boolean | Si la tarea está bloqueada |
| `motivo_bloqueo` | string | Obligatorio si `bloqueada = true` |
| `depende_de_ids` | uuid[] (FK Tasks) | Tareas que deben completarse antes |
| `bloquea_a_ids` | uuid[] (FK Tasks, calculado) | Tareas que dependen de ésta |

#### Contenido

| Campo | Tipo | Descripción |
|---|---|---|
| `checklist` | jsonb | `[{ texto, completado, orden }]` — subtareas internas |
| `archivos` | string[] | URLs de archivos adjuntos |
| `links_externos` | jsonb | Links relevantes (Figma, staging, Drive, etc.) |

#### Metadata

| Campo | Tipo | Descripción |
|---|---|---|
| `created_at` | timestamp | Fecha de creación |
| `updated_at` | timestamp | Última actualización |
| `completada_at` | timestamp | Fecha y hora de completado |
| `recurrente` | boolean | Si es tarea periódica |
| `recurrencia_config` | jsonb | `{ frecuencia, dia, hora }` si `recurrente = true` |

---

### Comentario de tarea (uno a muchos)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `task_id` | uuid (FK) | Tarea asociada |
| `user_id` | uuid (FK User) | Autor del comentario |
| `contenido` | text | Texto del comentario |
| `tipo` | enum | comentario / actualizacion / bloqueo / resolucion |
| `created_at` | timestamp | Fecha |

---

### Activity Log (registro de actividad — inmutable)

Cada cambio de estado, asignación, prioridad o edición queda registrado:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `task_id` | uuid (FK) | Tarea asociada |
| `user_id` | uuid (FK User) | Quién hizo el cambio (nullable si fue bot) |
| `bot_id` | string | Qué bot actuó (nullable si fue humano) |
| `accion` | enum | created / assigned / status_changed / priority_changed / commented / blocked / unblocked / completed / reopened |
| `valor_anterior` | string | Valor antes del cambio |
| `valor_nuevo` | string | Valor después del cambio |
| `created_at` | timestamp | Momento exacto |

---

## Estados posibles

```
Pendiente → Por hacer → Lista para empezar → En progreso → En revisión
    → Esperando feedback → Bloqueada ←→ En progreso
    → Pausada | Completada | Cancelada | Archivada
```

| Estado | Descripción |
|---|---|
| `pendiente` | Creada, sin inicio definido |
| `por_hacer` | En backlog activo, lista para priorizarse |
| `lista_para_empezar` | Asignada con todo definido, esperando que el owner la tome |
| `en_progreso` | El owner está trabajando activamente |
| `en_revision` | Trabajo hecho, bajo revisión (QA interno o revisor asignado) |
| `esperando_feedback` | Se envió al cliente o a un tercero, esperando respuesta |
| `bloqueada` | Detenida por dependencia (motivo obligatorio) |
| `pausada` | En pausa temporal con fecha de reanudación |
| `completada` | Terminada y validada |
| `cancelada` | Descartada (razón registrada) |
| `archivada` | Histórico, cerrada sin completar |

---

## Vistas disponibles

| Vista | Descripción | Uso principal |
|---|---|---|
| **Mi día** | Tareas propias del usuario activo para hoy | Foco personal diario |
| **Board Kanban** | Columnas por estado con drag & drop | Flujo de trabajo del equipo |
| **Lista general** | Tabla con todos los campos y filtros | Gestión completa |
| **Calendario** | Tareas posicionadas por deadline | Visión de vencimientos |
| **Timeline** | Ordenadas cronológicamente con barras | Planificación y solapamientos |
| **Workload** | Carga activa por persona / área | Detectar sobrecargas |

---

## KPIs del módulo

| KPI | Descripción | Cálculo |
|---|---|---|
| Tareas pendientes | Estados `por_hacer` + `lista_para_empezar` | COUNT |
| Tareas vencidas | `deadline` < hoy y estado ≠ completada/cancelada | COUNT |
| Tareas en progreso | Estado `en_progreso` | COUNT |
| Tareas bloqueadas | Estado `bloqueada` | COUNT |
| Completadas hoy | `completada_at` = hoy | COUNT |
| Cumplimiento de deadlines | Completadas a tiempo / total completadas | % |
| Tiempo promedio de resolución | `completada_at - created_at` | AVG en días |
| Productividad por equipo | Tareas completadas por área en el período | COUNT por `area` |
| Productividad individual | Tareas completadas por `owner_id` | COUNT por user |
| Backlog acumulado | Tareas `pendiente` + `por_hacer` sin deadline activo | COUNT |

---

## Bots y automatizaciones

| Bot | Trigger | Acción |
|---|---|---|
| **Auto Task Generator** | Hito creado en Proyecto / Servicio activado | Crea tareas estándar desde plantilla del tipo |
| **Deadline Reminder Bot** | `deadline` - 24h y - 2h | Push notification al owner |
| **Overdue Bot** | `deadline` < hoy y estado ≠ completada | Marca como vencida + alerta al owner + al PM del proyecto |
| **Blocked Task Bot** | `bloqueada = true` + 48h sin cambio | Escala alerta al owner del proyecto / director de área |
| **Recurring Task Bot** | Según `recurrencia_config` | Crea nueva instancia de la tarea automáticamente |
| **Assignment Bot** | Tarea creada sin owner | Sugiere owner basado en `area` y carga actual |
| **Workload Balance Bot** | Diariamente | Detecta usuarios con > X tareas activas y alerta al manager |
| **Completion Follow-up Bot** | Tarea en `en_revision` + 48h sin movimiento | Recuerda al revisor que hay algo pendiente |

---

## Capacidades IA del módulo

| Función IA | Descripción |
|---|---|
| **Descomponer tarea grande** | Divide una tarea compleja en subtareas accionables |
| **Resumen de avance** | Estado del trabajo del equipo en el día/semana |
| **Detección de bloqueos** | Identifica dependencias no resueltas |
| **Estimación de duración** | Predice horas necesarias según historial de tareas similares |
| **Priorización de backlog** | Ordena por impacto + urgencia + dependencias |
| **Sugerencia de responsable** | Recomienda owner según área, carga y expertise |
| **Detección de duplicados** | Identifica tareas similares ya existentes |
| **Generación de checklist** | Crea subtareas estándar para tipos conocidos de trabajo |
| **Resumen diario del equipo** | Digest de lo completado, en progreso y bloqueado |

Toda ejecución IA debe registrar métricas de coste según `01-constitution-v1.md §7`.

---

## Tareas recurrentes

Algunas tareas ocurren periódicamente. El campo `recurrencia_config` define su frecuencia:

```json
{
  "frecuencia": "semanal",     // diaria / semanal / mensual / personalizada
  "dia_semana": 1,             // 0=Dom, 1=Lun ... 6=Sab
  "hora": "09:00",             // hora de creación automática
  "auto_asignar": true         // si usa el mismo owner de la tarea padre
}
```

Ejemplos de tareas recurrentes:

- Revisión semanal de backlog (lunes 09:00)
- Reporte mensual de SEO
- Backup semanal de verificación
- Publicación de contenido semanal
- Revisión de tickets sin respuesta (diaria)

---

## Relaciones con otros módulos

| Módulo | Relación |
|---|---|
| **Proyectos** | Tarea puede pertenecer a un proyecto (alimenta `porcentaje_avance`) |
| **Servicios** | Tarea puede vincularse a un servicio activo |
| **Clientes** | Tarea puede pertenecer a un cliente sin proyecto asociado |
| **Tickets** | Un ticket puede generar una tarea de resolución |
| **Laboratorio IA** | Agentes pueden crear tareas y actualizar su estado |
| **Reuniones** | Action items post-reunión se convierten en tareas automáticamente |

---

## Reglas críticas de negocio

### Regla 1 — Owner siempre obligatorio
Toda tarea debe tener `owner_id`. Sin owner → el sistema bloquea el guardado.

### Regla 2 — Estado siempre visible
Toda tarea tiene un estado. Nunca puede estar en estado nulo o indefinido.

### Regla 3 — Activity Log inmutable
Cada cambio queda registrado en el Activity Log. Ningún registro puede editarse ni eliminarse.

### Regla 4 — Bloqueo documentado
Si `bloqueada = true`, `motivo_bloqueo` es obligatorio. Sin motivo → el estado `bloqueada` no se puede guardar.

### Regla 5 — Fecha de cierre real automática
`fecha_cierre_real` se registra automáticamente al pasar a `completada`. No se puede editar manualmente.

### Regla 6 — Toda acción relevante es tarea
Cualquier trabajo de más de 15 minutos que requiera ser recordado, entregado o validado debe convertirse en tarea en el ERP.

---

## Las 8 preguntas estratégicas del módulo

| Pregunta | Campo / Fuente |
|---|---|
| ¿Qué tiene que hacer cada persona hoy? | Vista "Mi día" — `owner_id = usuario_activo` + deadline ≤ hoy |
| ¿Qué está vencido? | `deadline < hoy` y `estado ≠ completada/cancelada` |
| ¿Qué está bloqueado? | `bloqueada = true` |
| ¿Qué está por entregarse? | `deadline` ≤ 48h |
| ¿Qué tareas están atrasadas? | `en_progreso` + `deadline` pasado |
| ¿Qué equipo está sobrecargado? | Vista Workload — tareas activas por `area` |
| ¿Qué avance real tiene cada proyecto? | `porcentaje_avance` calculado en Proyectos desde tareas |
| ¿Dónde está frenada la operación? | `bloqueada = true` agrupado por proyecto / área |

---

## Criterios de aceptación (DoD)

Para que esta spec se considere implementada:

- [ ] CRUD completo de tareas con todas las validaciones
- [ ] Las 6 vistas: Mi día, Kanban, Lista, Calendario, Timeline, Workload
- [ ] Subtareas (parent_task_id) con jerarquía visible
- [ ] Checklist interna por tarea con ítems checkeable
- [ ] Dependencias entre tareas (depende_de / bloquea_a)
- [ ] Activity Log inmutable por tarea
- [ ] Comentarios con tipos diferenciados
- [ ] `owner_id` obligatorio — bloqueo al guardar sin él
- [ ] `motivo_bloqueo` obligatorio cuando `bloqueada = true`
- [ ] `fecha_cierre_real` registrada automáticamente al completar
- [ ] KPIs del dashboard en tiempo real
- [ ] Tareas recurrentes con configuración de frecuencia
- [ ] `porcentaje_avance` del proyecto actualizado cuando tarea cambia estado
- [ ] Deadline Reminder Bot (24h y 2h antes)
- [ ] Overdue Bot con escalado al PM del proyecto
- [ ] Blocked Task Bot con escalado a las 48h
- [ ] Workload Balance Bot con umbral configurable
- [ ] Resumen IA diario del equipo
- [ ] Descomposición IA de tareas grandes en subtareas
- [ ] Exportar tareas a CSV
- [ ] Filtros: área, estado, prioridad, owner, proyecto, etiqueta, vencidas
- [ ] Métricas IA registradas por cada ejecución

---

## Módulo Delivery — completo

Con esta spec se cierra el módulo Delivery del ERP:

| Spec | Módulo |
|---|---|
| ERP-006 Clientes | Ficha maestra del cliente |
| ERP-007 Servicios | Catálogo operativo de servicios vendidos |
| ERP-008 Proyectos | Centro de ejecución y tracking |
| ERP-009 Tareas ← | Sistema de ejecución diaria |

---

## Próximos pasos

1. Aprobar esta spec con el equipo — **cierra módulo Delivery**
2. Iniciar specs del módulo **Studio → Laboratorio IA** (ERP-010)
3. Definir schema Prisma para entidades `Task`, `TaskComment` y `TaskActivityLog`
4. Diseñar endpoints REST (`/api/tasks`, `/api/tasks/:id/comments`)
5. Definir lógica de `porcentaje_avance` en Proyectos: `completadas / total × 100`
6. Especificar integración bidireccional Task ↔ Project para el Progress Tracking Bot
