# ERP-013 — Operations / Tickets & Soporte

**Spec ID:** 14  
**Código:** ERP-013  
**Módulo:** Operations → Tickets & Soporte  
**Estado:** 🟡 DRAFT v1  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  

---

## Objetivo del módulo

El módulo Tickets & Soporte centraliza toda solicitud, incidencia, consulta, requerimiento técnico o necesidad operativa enviada por clientes o generada internamente dentro de Inspyra.

Es el **centro de soporte operativo del ERP**.

Su función es garantizar que ningún pedido quede sin respuesta, seguimiento o resolución.

---

## Qué resuelve

| Sin módulo Tickets | Con módulo Tickets |
|---|---|
| Pedidos por WhatsApp que se pierden | Bandeja única de soporte centralizada |
| Emails olvidados | Seguimiento completo por ticket |
| Soporte técnico desordenado | Responsables asignados y visibles |
| Falta de trazabilidad | Historial completo de cada caso |
| Tickets sin owner claro | Asignación y escalación automática |
| Tiempos de resolución invisibles | SLA medidos y alertados en tiempo real |

---

## Principio central

> **Toda solicitud debe convertirse en ticket.**

Si requiere respuesta, seguimiento o resolución — debe existir como ticket en el ERP. Nada importante puede quedar en WhatsApp, email o memoria humana.

---

## Qué vive dentro del módulo

Todo pedido interno o externo que requiere atención:

| Área | Ejemplos |
|---|---|
| Infraestructura | SSL vencido, VPS caído, web caída, error de deploy |
| Cloud | Incidencia cloud, problema API, escalado recursos |
| Email | Migración email, acceso panel, buzón lleno |
| Desarrollo | Bug en software, actualización web, integración rota |
| SEO / Ads | Problema cuenta Google Ads, caída de posicionamiento |
| Accesos | Contraseña olvidada, creación de usuario, permisos |
| Facturación | Consulta de factura, error de cobro, duplicado |
| Consulta general | Pregunta post-venta, solicitud de información |
| Mantenimiento | Correctivo (error) o evolutivo (mejora solicitada) |

---

## Qué NO vive aquí

| ❌ No aquí | ✅ Dónde va |
|---|---|
| Prospectos nuevos | Módulo Prospectos |
| Leads comerciales iniciales | Módulo Campañas |
| Reuniones comerciales | Módulo Reuniones |
| Tareas de proyecto planificadas | Módulo Tareas (ERP-009) |

---

## Fuentes de entrada de tickets

| Canal | Descripción |
|---|---|
| **Email** | Vía Inspyra Mail → Mail-to-Ticket Bot convierte automáticamente |
| **Formulario web** | Formulario de soporte en el dashboard del cliente |
| **HostingGuard dashboard** | Ticket técnico creado desde el panel del cliente |
| **Inspyra Cloud dashboard** | Ticket cloud o infra desde el panel |
| **WhatsApp** | Manual por el equipo o automatizado vía webhook |
| **Creación manual** | Equipo interno crea ticket directamente en el ERP |
| **Automatización IA** | Sistema detecta incidente y genera ticket automáticamente |

---

## Flujo del ciclo de vida del ticket

```
Ingreso → Clasificación → Prioridad → Asignación → Resolución → Validación → Cierre
```

### Paso 1 — Ingreso
Ticket entra al sistema desde cualquier canal. Estado inicial: `nuevo`.

### Paso 2 — Clasificación
Manual o automática via `Classification Bot`. Se asigna categoría, subcategoría y se detecta el cliente.

### Paso 3 — Prioridad
Manual o via `Priority Detection Bot`. Se determina el nivel de urgencia y el SLA objetivo.

### Paso 4 — Asignación
`Assignment Bot` o asignación manual. Estado pasa a `asignado`. El responsable recibe notificación.

### Paso 5 — Resolución
El equipo trabaja el caso. Estado `en_progreso`. Se pueden registrar comentarios internos y respuestas al cliente.

### Paso 6 — Validación
Se confirma con el cliente que la solución resuelve el problema. Estado `resuelto`.

### Paso 7 — Cierre
Ticket pasa a `cerrado`. `Satisfaction Follow-up Bot` envía encuesta al cliente. Historial queda permanente.

---

## Modelo de datos

### Ticket (entidad principal)

#### Identificación

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único |
| `numero_ticket` | string | Correlativo legible (`TKT-2026-0001`) |
| `asunto` | string | Título del ticket |
| `descripcion` | text | Descripción completa del problema o solicitud |

#### Origen

| Campo | Tipo | Descripción |
|---|---|---|
| `client_id` | uuid (FK Client) | Cliente que genera el ticket |
| `contact_name` | string | Nombre del contacto (puede no ser el owner del cliente) |
| `email_origen` | string | Email desde donde llegó la solicitud |
| `canal_origen` | enum | email / formulario / hostingguard / cloud / whatsapp / manual / automatico |
| `service_id` | uuid (FK Service) | Servicio relacionado (nullable) |
| `project_id` | uuid (FK Project) | Proyecto relacionado (nullable) |

#### Clasificación

| Campo | Tipo | Descripción |
|---|---|---|
| `categoria` | enum | hosting / vps / deploy / ssl / dominios / cloud / web / software / seo / ads / email_mkt / facturacion / acceso / bug / integracion / incidente_critico / consulta |
| `subcategoria` | string | Detalle libre dentro de la categoría (nullable) |
| `prioridad` | enum | baja / media / alta / urgente / critica |
| `estado` | enum | Ver estados posibles |

#### Asignación

| Campo | Tipo | Descripción |
|---|---|---|
| `owner_id` | uuid (FK User) | Responsable principal del ticket |
| `equipo_ids` | uuid[] (FK Users) | Colaboradores adicionales (nullable) |

#### SLA

| Campo | Tipo | Descripción |
|---|---|---|
| `sla_objetivo_minutos` | int | Tiempo máximo de resolución en minutos según prioridad |
| `sla_vencimiento_at` | timestamp (calculado) | `created_at + sla_objetivo_minutos` |
| `sla_cumplido` | boolean (calculado) | Si se resolvió antes del vencimiento |

#### Fechas

| Campo | Tipo | Descripción |
|---|---|---|
| `created_at` | timestamp | Fecha de creación |
| `updated_at` | timestamp | Última actualización |
| `primera_respuesta_at` | timestamp | Cuándo se envió la primera respuesta al cliente |
| `resuelto_at` | timestamp | Cuándo se marcó como resuelto |
| `cerrado_at` | timestamp | Cuándo se cerró definitivamente |
| `tiempo_resolucion_minutos` | int (calculado) | `resuelto_at − created_at` en minutos |

#### Satisfacción

| Campo | Tipo | Descripción |
|---|---|---|
| `satisfaccion_score` | int | Puntuación CSAT del cliente (1–5, nullable) |
| `satisfaccion_comentario` | text | Comentario de satisfacción (nullable) |

---

### TicketComment (Comentario / Actividad)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `ticket_id` | uuid (FK) | Ticket al que pertenece |
| `author_id` | uuid (FK User) | Autor del comentario |
| `tipo` | enum | interno / respuesta_cliente / cambio_estado / nota_sistema |
| `contenido` | text | Cuerpo del comentario |
| `visible_para_cliente` | boolean | Si el cliente puede ver este comentario |
| `created_at` | timestamp | — |

---

### TicketAttachment (Adjunto)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `ticket_id` | uuid (FK) | Ticket al que pertenece |
| `nombre_archivo` | string | Nombre original del archivo |
| `url` | string | URL del archivo almacenado |
| `tipo_mime` | string | MIME type (image/png, application/pdf…) |
| `tamanio_bytes` | int | Tamaño del archivo |
| `uploaded_by_id` | uuid (FK User) | Quién subió el archivo |
| `created_at` | timestamp | — |

---

## Estados posibles

| Estado | Descripción |
|---|---|
| `nuevo` | Ticket ingresado, aún no clasificado ni asignado |
| `abierto` | Clasificado, pendiente de asignación |
| `asignado` | Responsable asignado, aún sin trabajo iniciado |
| `en_revision` | Equipo revisando el problema |
| `en_progreso` | Trabajo activo en curso |
| `esperando_cliente` | Se envió respuesta, esperando confirmación del cliente |
| `esperando_tercero` | Bloqueado por un proveedor o sistema externo |
| `resuelto` | Solución aplicada, pendiente de confirmación formal |
| `cerrado` | Caso confirmado resuelto y cerrado |
| `reabierto` | Cliente reportó que el problema persiste |
| `cancelado` | Ticket descartado (duplicado, inválido) |

---

## SLA por prioridad

| Prioridad | Tiempo máximo resolución | Uso |
|---|---|---|
| **Crítica** | 15 min respuesta inicial · 1h resolución | Servicio caído, pérdida operativa inmediata |
| **Urgente** | 2h resolución | Impacta operativa del cliente |
| **Alta** | 8h resolución | Problema real sin pérdida total |
| **Media** | 24h resolución | Solicitud normal |
| **Baja** | 48–72h resolución | Consulta, mejora menor |

---

## Categorías y subcategorías

| Categoría | Subcategorías ejemplo |
|---|---|
| `hosting` | VPS caído, SSL vencido, error DNS, backups |
| `deploy` | Error de build, deploy fallido, rollback |
| `ssl` | Vencimiento, error certificado, renovación |
| `dominios` | Propagación, subdominio, redirect |
| `cloud` | Escalado, error infra, región, costos |
| `web` | Actualización, bug visual, velocidad |
| `software` | Bug funcional, error API, integración |
| `seo` | Penalización, caída posición, error crawl |
| `ads` | Cuenta suspendida, error campaña, facturación Ads |
| `email_mkt` | Rebotes, spam, plantilla, DNS |
| `facturacion` | Error factura, pago, reembolso |
| `acceso` | Contraseña, usuario, permisos, 2FA |
| `incidente_critico` | Cualquier emergencia multi-servicio |
| `consulta` | Pregunta general, orientación |

---

## KPIs del módulo (siempre visibles)

| KPI | Cálculo | Alerta |
|---|---|---|
| Tickets abiertos | COUNT estados activos (nuevo + abierto + asignado + en_progreso) | — |
| Tickets nuevos hoy | COUNT tickets creados hoy | — |
| Tickets críticos | COUNT prioridad `critica` o `urgente` abiertos | si > 0 |
| Tickets vencidos SLA | COUNT `sla_vencimiento_at` < now() y no cerrado | si > 0 |
| Tiempo promedio resolución | AVG(tiempo_resolucion_minutos) último mes | si > meta |
| Tickets resueltos hoy | COUNT `resuelto_at` = hoy | — |
| Sin asignar | COUNT estado `nuevo` o `abierto` sin `owner_id` | si > 5 |
| Esperando cliente | COUNT estado `esperando_cliente` | si > 10 |
| CSAT promedio | AVG(satisfaccion_score) último mes | si < 4.0 |
| Tickets por colaborador | COUNT por `owner_id` abiertos | — |

---

## Vistas internas

| Vista | Descripción |
|---|---|
| **Inbox General** | Todos los tickets con filtros completos |
| **Mis Tickets** | Tickets asignados al usuario logueado |
| **Sin Asignar** | Estado `nuevo` o `abierto` sin owner |
| **Urgentes / Críticos** | Prioridad `urgente` o `critica` activos |
| **SLA en Riesgo** | `sla_vencimiento_at` < ahora + 2h |
| **Esperando Cliente** | Estado `esperando_cliente` |
| **Resueltos** | Historial cerrado con búsqueda |
| **Por Cliente** | Tickets agrupados por cliente |

---

## Bots y automatizaciones

| Bot | Trigger | Acción |
|---|---|---|
| **Mail-to-Ticket Bot** | Email recibido en dirección de soporte | Crea ticket automáticamente con asunto, cuerpo y adjuntos |
| **Classification Bot** | Ticket nuevo sin categoría | Analiza descripción, asigna categoría + subcategoría automáticamente |
| **Priority Detection Bot** | Ticket nuevo sin prioridad | Detecta urgencia por palabras clave ("caído", "urgente", "pérdida") |
| **Assignment Bot** | Ticket con categoría definida sin owner | Asigna al equipo correcto según categoría y carga de trabajo |
| **SLA Monitor Bot** | Cada 5 minutos sobre tickets abiertos | Detecta tickets próximos a vencer SLA y alerta al owner + director |
| **Escalation Bot** | Ticket crítico sin movimiento > 15 min | Escala al director + notificación Slack/WhatsApp |
| **Reminder Bot** | Ticket sin actualización en X horas | Recuerda al owner que hay movimiento pendiente |
| **Auto Close Bot** | Ticket en `resuelto` sin respuesta del cliente en 48h | Cierra automáticamente con nota en historial |
| **Satisfaction Follow-up Bot** | Ticket pasa a `cerrado` | Envía encuesta CSAT al cliente (escala 1-5 + comentario) |
| **Reopen Detection Bot** | Cliente responde a ticket `cerrado` | Reabre el ticket automáticamente con estado `reabierto` |

---

## Capacidades IA del módulo

| Función IA | Descripción |
|---|---|
| **Clasificación automática** | Detecta categoría, subcategoría y prioridad desde el texto del ticket |
| **Resumen del problema** | Resume el ticket en 3 líneas para el agente asignado |
| **Recomendación de solución** | Basada en tickets similares resueltos anteriormente |
| **Detección de tickets repetidos** | Identifica si el mismo problema fue reportado antes y vincula tickets |
| **Propuesta de respuesta al cliente** | Genera borrador de respuesta profesional para el agente |
| **Detección de sentimiento** | Analiza el tono del cliente (frustrado, neutral, satisfecho) |
| **Alerta de riesgo de churn** | Si el cliente tiene tickets críticos repetidos + tono negativo → alerta account manager |
| **Resumen de conversación** | Condensa todo el historial de un ticket largo en 5 líneas |
| **Análisis de causas raíz** | Detecta patrones de incidencias repetidas por servicio o infraestructura |

Toda ejecución IA registra métricas de coste según `01-constitution-v1.md §7`.

---

## Relaciones con otros módulos

| Módulo | Relación |
|---|---|
| **Clientes** | Cada ticket pertenece a un cliente — FK obligatorio |
| **Servicios** | Ticket puede vincularse al servicio afectado |
| **HostingGuard** | Tickets técnicos de infraestructura hosting |
| **Inspyra Cloud** | Tickets de cloud e infra AWS del cliente |
| **Inspyra Mail** | Entrada automática de tickets vía email + envío de respuestas |
| **Facturación** | Consultas sobre facturas o cobros generan ticket en esta categoría |
| **Proyectos** | Un ticket puede escalar a tarea de proyecto si requiere desarrollo |
| **Reportes** | KPIs de soporte para informes de calidad |

---

## Reglas críticas de negocio

### Regla 1 — Estado siempre visible
Todo ticket debe tener estado en todo momento. No puede estar en estado nulo o indefinido.

### Regla 2 — Prioridad obligatoria
Todo ticket debe tener prioridad asignada antes de pasar a estado `asignado`.

### Regla 3 — Owner obligatorio para escalar
Ningún ticket puede estar en `en_progreso` sin `owner_id`. Si el bot no puede asignar → crea alerta de bandeja sin owner.

### Regla 4 — Historial inmutable
Toda actividad en un ticket (comentarios, cambios de estado, respuestas) se registra en `TicketComment` como append-only. Nada se edita ni elimina del historial.

### Regla 5 — Escalación automática de críticos
Todo ticket con prioridad `critica` sin primera respuesta en 15 minutos activa `Escalation Bot`. Sin excepción.

### Regla 6 — Historial permanente al cerrar
Los tickets cerrados no se eliminan nunca. Sirven como base de conocimiento para clasificación IA y análisis de patrones.

### Regla 7 — Ninguna solicitud cliente puede perderse
Toda comunicación de un cliente que requiera acción debe existir como ticket. Si entra por WhatsApp → el equipo lo crea manualmente en el momento.

---

## Criterios de aceptación (DoD)

Para que esta spec se considere implementada:

- [ ] CRUD completo de tickets con validaciones de campos obligatorios
- [ ] Numeración correlativa automática (`TKT-YYYY-XXXX`)
- [ ] Timeline de actividad completa por ticket (TicketComment append-only)
- [ ] Subida de adjuntos a S3 con preview en UI
- [ ] Mail-to-Ticket Bot: email → ticket automático con adjuntos
- [ ] Classification Bot clasifica categoría con IA
- [ ] Priority Detection Bot detecta urgencia desde texto
- [ ] Assignment Bot asigna por categoría y carga de trabajo
- [ ] SLA Monitor Bot alerta 30 min antes del vencimiento
- [ ] Escalation Bot para tickets críticos sin respuesta en 15 min
- [ ] Auto Close Bot cierra tickets resueltos tras 48h sin respuesta
- [ ] Satisfaction Follow-up Bot envía CSAT al cerrar
- [ ] Reopen Detection Bot reactiva ticket si cliente responde
- [ ] Dashboard con los 10 KPIs principales en tiempo real
- [ ] 8 vistas filtradas: Inbox, Mis Tickets, Sin Asignar, Urgentes, SLA Riesgo, Esperando Cliente, Resueltos, Por Cliente
- [ ] Respuesta al cliente desde el ERP (email via Inspyra Mail)
- [ ] Detección IA de churn risk por tickets repetidos + sentimiento negativo
- [ ] Recomendación IA de solución basada en tickets similares
- [ ] Exportar historial de tickets a CSV por período y filtros
- [ ] Tests unitarios ≥ 85% en servicios de SLA y escalación

---

## Próximos pasos

1. Aprobar esta spec
2. Crear `15-erp-014-operations-reportes.md`
3. Definir schema Prisma: `Ticket`, `TicketComment`, `TicketAttachment`
4. Diseñar endpoints REST: `/api/tickets`, `/api/tickets/:id/comments`, `/api/tickets/:id/attachments`
5. Diseñar webhook Mail-to-Ticket: email entrante → POST interno → creación ticket
6. Definir base de conocimiento interna para entrenamiento del Classification Bot
7. Especificar integración con Inspyra Mail para respuestas y encuestas CSAT
