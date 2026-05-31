# ERP-017 — Inspyra Mail

**Spec ID:** 18  
**Código:** ERP-017  
**Módulo:** Inspyra Mail (unidad satélite — comunicación)  
**Estado:** 🟡 DRAFT v1  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  

---

## Objetivo del módulo

El módulo Inspyra Mail centraliza toda la comunicación entrante y saliente de Inspyra dentro del ERP.

Funciona como **centro unificado de comunicación comercial, operativa, administrativa y de soporte**.

Su propósito es garantizar que toda interacción por email o formulario quede registrada, automatizada, trazable y conectada con el resto del negocio.

---

## Qué representa dentro del ecosistema

Inspyra Mail es la **capa de comunicación oficial de Inspyra**. No es solo correo — es el centro nervioso de toda interacción externa:

- Emails comerciales y de prospección
- Emails de soporte técnico y operativo
- Emails administrativos y de facturación
- Formularios web entrantes
- Respuestas automáticas y secuencias
- Notificaciones internas del ERP

---

## Distinción importante — Inspyra Mail vs Email Marketing

| Inspyra Mail (ERP-017) | Email Marketing (ERP-018) |
|---|---|
| Comunicación 1:1 y transaccional | Campañas masivas y secuencias outbound |
| Bandeja compartida del equipo | Plataforma de envío bulk |
| Respuesta a leads entrantes | Captación activa |
| Historial por cliente | Métricas de campaña (open rate, CTR) |
| SES transaccional | SES bulk (pool separado) |

Comparten la infraestructura SES de Inspyra pero **nunca el mismo pool de IPs ni las mismas credenciales** (regla de reputación).

---

## Principio central

> **Toda comunicación debe quedar centralizada dentro del ERP.**

Todo mensaje debe poder: leerse, clasificarse, responderse, asignarse, automatizarse y rastrearse históricamente.

---

## Qué vive dentro del módulo

- Emails entrantes y enviados
- Formularios web (presupuesto, soporte, contacto)
- Conversaciones 1:1 por cliente / prospecto
- Templates reutilizables por área
- Secuencias de email automatizadas
- Notificaciones internas del ERP hacia el equipo

---

## Qué NO vive aquí

| ❌ No aquí | Nota |
|---|---|
| Chat interno del equipo | Extensión futura posible |
| WhatsApp nativo | Integración futura vía webhook |
| DM Instagram / Redes | Extensión futura |
| Campañas masivas | ERP-018 Email Marketing |

---

## Casillas email corporativas soportadas

| Casilla | Área |
|---|---|
| `hola@inspyra.cloud` | Entrada general / comercial |
| `ventas@inspyra.cloud` | Comercial / leads |
| `soporte@inspyra.cloud` | Soporte técnico |
| `billing@inspyra.cloud` | Facturación y cobros |
| `hosting@inspyra.cloud` | HostingGuard |
| `cloud@inspyra.cloud` | Inspyra Cloud |
| `marketing@inspyra.cloud` | Campañas y email marketing |
| `hola@hostingguard.lat` | HostingGuard direct |
| `notifications@inspyra.cloud` | Transaccional (ERP-011/012 hooks) |

Cada casilla tiene su bandeja dentro del módulo y puede tener reglas de routing distintas.

---

## Flujo general

```
Mensaje ingresa → Clasificación IA → Routing automático → Auto-reply → Creación entidad ERP → Asignación → Seguimiento → Cierre
```

### Paso 1 — Ingreso
Email entra por IMAP/webhook o formulario web activa endpoint del ERP.

### Paso 2 — Clasificación automática
`Classification Bot` + IA detecta intención: comercial / soporte / facturación / spam / otro.

### Paso 3 — Routing automático
`Routing Bot` asigna a la bandeja y área correspondiente según clasificación + casilla destino.

### Paso 4 — Auto-reply opcional
Si hay template configurado para la casilla → respuesta inmediata al remitente.

### Paso 5 — Creación de entidad ERP
Según tipo detectado:

| Intención | Entidad creada |
|---|---|
| Lead comercial | Prospecto en ERP-001 |
| Consulta soporte | Ticket en ERP-013 |
| Consulta facturación | Nota en ERP-012 vinculada al cliente |
| Cliente conocido | Entrada en historial de conversación |

### Paso 6 — Asignación interna
Owner responsable asignado. Equipo notificado.

### Paso 7 — Seguimiento
Hasta resolución, cierre o conversión. `Follow-up Bot` vigila inactividad.

---

## Modelo de datos

### EmailMessage (Email registrado)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `message_id` | string | ID único del mensaje (Message-ID del header SMTP) |
| `thread_id` | string | ID del hilo de conversación (nullable) |
| `casilla_destino` | string | Casilla receptora (ej: `soporte@inspyra.cloud`) |
| `remitente_email` | string | Email del remitente |
| `remitente_nombre` | string | Nombre del remitente (nullable) |
| `destinatarios` | string[] | Lista de destinatarios To |
| `cc` | string[] | CC (nullable) |
| `bcc` | string[] | BCC (nullable) |
| `subject` | string | Asunto del mensaje |
| `body_text` | text | Cuerpo en texto plano |
| `body_html` | text | Cuerpo en HTML (nullable) |
| `direccion` | enum | entrante / saliente |
| `tipo` | enum | comercial / soporte / facturacion / onboarding / notificacion / spam / otro |
| `estado` | enum | nuevo / leido / respondido / asignado / archivado / spam |
| `prioridad` | enum | normal / alta / urgente |
| `client_id` | uuid (FK Client) | Cliente vinculado (nullable — puede no estar identificado aún) |
| `prospect_id` | uuid (FK Prospect) | Prospecto vinculado (nullable) |
| `ticket_id` | uuid (FK Ticket) | Ticket creado desde este email (nullable) |
| `invoice_id` | uuid (FK Invoice) | Factura relacionada (nullable) |
| `assigned_to_id` | uuid (FK User) | Responsable asignado (nullable) |
| `has_attachments` | boolean | Si tiene archivos adjuntos |
| `received_at` | timestamp | Fecha y hora de recepción/envío |
| `read_at` | timestamp | Cuándo fue leído (nullable) |
| `replied_at` | timestamp | Cuándo se respondió (nullable) |

---

### EmailAttachment (Adjunto)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `email_id` | uuid (FK EmailMessage) | Email al que pertenece |
| `nombre_archivo` | string | Nombre original |
| `url` | string | URL en S3 |
| `tipo_mime` | string | MIME type |
| `tamanio_bytes` | int | Tamaño |

---

### EmailTemplate (Template reutilizable)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `nombre` | string | Nombre identificador (ej: "Respuesta comercial inicial") |
| `area` | enum | comercial / soporte / facturacion / onboarding / general |
| `subject` | string | Asunto del template (con variables `{{nombre}}`) |
| `body_html` | text | Cuerpo HTML con variables de sustitución |
| `variables` | string[] | Lista de variables disponibles (`{{nombre}}`, `{{empresa}}`, etc.) |
| `activo` | boolean | Si está disponible para uso |
| `created_by_id` | uuid (FK User) | Quién lo creó |
| `created_at` | timestamp | — |

---

### EmailSequence (Secuencia automatizada)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `nombre` | string | Nombre de la secuencia (ej: "Onboarding nuevo cliente") |
| `trigger` | enum | nuevo_prospecto / lead_sin_respuesta / factura_emitida / cliente_nuevo / cliente_inactivo / manual |
| `activa` | boolean | Si está habilitada |
| `pasos` | jsonb | Array de pasos: `[{delay_hours, template_id, condicion_parar}]` |
| `created_at` | timestamp | — |

---

### EmailSequenceEnrollment (Inscripción en secuencia)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `sequence_id` | uuid (FK EmailSequence) | Secuencia a la que pertenece |
| `contact_email` | string | Email del contacto inscripto |
| `client_id` | uuid (FK) | Cliente asociado (nullable) |
| `prospect_id` | uuid (FK) | Prospecto asociado (nullable) |
| `paso_actual` | int | Índice del paso en que se encuentra |
| `estado` | enum | activa / pausada / completada / cancelada / respondio |
| `proximo_envio_at` | timestamp | Cuándo se envía el siguiente paso |
| `created_at` | timestamp | — |

> **Regla de secuencias**: si el contacto responde en cualquier momento → `estado = respondio`, secuencia se detiene inmediatamente. Nunca enviar el siguiente paso si ya hubo respuesta humana.

---

### WebForm (Formulario web entrante)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `formulario` | enum | presupuesto / soporte / contacto / hostingguard / cloud / otro |
| `nombre` | string | Nombre del remitente |
| `email` | string | Email de contacto |
| `empresa` | string | Empresa (nullable) |
| `mensaje` | text | Contenido del mensaje |
| `datos_extras` | jsonb | Campos específicos del formulario (ej: URL del sitio, tipo de servicio) |
| `ip_origen` | string | IP del envío |
| `email_id` | uuid (FK EmailMessage) | Email generado desde este formulario (nullable) |
| `prospect_id` | uuid (FK) | Prospecto creado (nullable) |
| `procesado` | boolean | Si ya fue clasificado y enrutado |
| `created_at` | timestamp | — |

---

## Estructura interna — Vistas del módulo

### Vista 1 — Inbox General
Bandeja principal con todos los mensajes. Sub-tabs: No leídos · Pendientes · Respondidos · Archivados · Spam.

### Vista 2 — Bandejas por área
| Bandeja | Contenido |
|---|---|
| **Comercial** | Leads, presupuestos, respuestas a propuestas |
| **Soporte** | Consultas técnicas, tickets originados por email |
| **Facturación** | Pagos, facturas, consultas administrativas |
| **Clientes activos** | Comunicación operativa de clientes en curso |
| **Marketing** | Respuestas a newsletters y campañas |
| **Dirección** | Comunicación relevante para dirección |

### Vista 3 — Conversaciones por cliente
Timeline de toda la comunicación con un cliente específico: emails enviados y recibidos, formularios, fecha y autor de cada interacción, archivos adjuntos. Accesible desde la ficha del cliente en ERP-006.

### Vista 4 — Formularios Web
Tabla de todos los envíos de formularios con estado de procesamiento. Click → detalle + acción: crear prospecto / abrir ticket / responder.

### Vista 5 — Templates
Biblioteca de templates con preview. CRUD completo. Búsqueda por área.

### Vista 6 — Secuencias
Lista de secuencias activas con: cantidad de contactos inscriptos, paso promedio actual, tasa de respuesta, tasa de completado. CRUD de secuencias y pasos.

### Vista 7 — Historial completo
Buscador global de emails por remitente, asunto, contenido, fecha, cliente.

---

## Ejemplos de secuencias predefinidas

### Secuencia comercial — lead sin respuesta
| Paso | Delay | Acción |
|---|---|---|
| 1 | 0h | Auto-reply de recepción |
| 2 | 24h | Follow-up comercial con template "Seguimiento inicial" |
| 3 | 72h | Segundo seguimiento con CTA a agendar reunión |
| 4 | 7 días | Último recordatorio antes de archivar |

Condición de parada: respuesta del contacto en cualquier punto.

### Secuencia onboarding — cliente nuevo
| Paso | Delay | Acción |
|---|---|---|
| 1 | 0h | Bienvenida con accesos y próximos pasos |
| 2 | 24h | Brief inicial — solicitar información del proyecto |
| 3 | 3 días | Confirmar accesos entregados |
| 4 | 7 días | Check-in de onboarding |

### Secuencia facturación — factura por vencer
| Paso | Delay | Acción |
|---|---|---|
| 1 | -7 días del vencimiento | Aviso de próximo vencimiento |
| 2 | Día del vencimiento | Recordatorio de pago |
| 3 | +7 días | Aviso de mora con link de pago |

---

## KPIs del módulo (siempre visibles)

| KPI | Cálculo | Alerta |
|---|---|---|
| Emails recibidos hoy | COUNT entrantes del día | — |
| Emails enviados hoy | COUNT salientes del día | — |
| Pendientes de respuesta | COUNT estado `nuevo` + `asignado` sin `replied_at` | si > 10 |
| Tiempo promedio respuesta | AVG(replied_at − received_at) | si > 4h |
| Leads detectados desde email | COUNT tipo `comercial` hoy | — |
| Tickets creados desde email | COUNT tickets con email origen | — |
| Formularios web recibidos | COUNT WebForm hoy | — |
| Secuencias activas | COUNT enrollments estado `activa` | — |
| Auto-replies ejecutados | COUNT respuestas automáticas hoy | — |
| Sin asignar | COUNT emails sin `assigned_to_id` > 2h | si > 5 |

---

## Bots y automatizaciones

| Bot | Trigger | Acción |
|---|---|---|
| **Auto Reply Bot** | Email entrante en casilla con template configurado | Envía respuesta automática inmediata |
| **Classification Bot** | Email entrante sin clasificar | Detecta tipo (comercial / soporte / facturación / spam) con IA |
| **Lead Detection Bot** | Email clasificado como `comercial` | Crea `Prospect` en ERP-001 si no existe el contacto |
| **Ticket Detection Bot** | Email clasificado como `soporte` | Crea `Ticket` en ERP-013 con el email como origen |
| **Billing Detection Bot** | Email clasificado como `facturación` | Vincula al cliente + notifica al área de billing |
| **Spam Detection Bot** | Email con score de spam > umbral | Mueve a bandeja Spam + no procesa |
| **Routing Bot** | Email clasificado | Asigna a bandeja de área + notifica al responsable del área |
| **Follow-up Bot** | Email pendiente sin respuesta > X horas | Recuerda al responsable asignado |
| **Escalation Bot** | Email sin respuesta > umbral crítico | Escala al director + crea alerta |
| **Sequence Bot** | Trigger de secuencia activado | Inscribe contacto en secuencia y gestiona los pasos |
| **Client Linking Bot** | Email entrante con dominio o email conocido | Vincula automáticamente al cliente del ERP |

---

## Capacidades IA del módulo

| Función IA | Descripción |
|---|---|
| **Clasificación automática** | Detecta tipo e intención del email con ≥ 90% de precisión |
| **Resumen de email largo** | Condensa emails extensos en 3 líneas con la acción requerida |
| **Detección de urgencia** | Identifica emails que requieren respuesta inmediata por tono o contenido |
| **Detección de sentimiento** | Analiza si el cliente está satisfecho, neutro, frustrado o en riesgo de churn |
| **Propuesta de respuesta** | Genera borrador de respuesta profesional lista para revisar y enviar |
| **Detección de oportunidad comercial** | Identifica si un email de soporte contiene una oportunidad de upsell |
| **Resumen de hilo de conversación** | Condensa todo el historial con un cliente en 5 líneas con el estado actual |
| **Detección de riesgo de churn** | Si el tono del cliente es negativo sostenido → alerta al account manager |

Toda ejecución IA registra métricas de coste según `01-constitution-v1.md §7`.

---

## Relaciones con otros módulos

| Módulo | Relación |
|---|---|
| **Prospectos (ERP-001)** | Formularios web y emails comerciales → nuevo prospecto |
| **Seguimiento (ERP-003)** | Emails de follow-up comercial originados en el módulo |
| **Clientes (ERP-006)** | Historial de conversación visible en ficha del cliente |
| **Tickets (ERP-013)** | Emails de soporte → ticket automático; ERP-013 usa Inspyra Mail para respuestas |
| **Facturación (ERP-012)** | Envío automático de facturas y recordatorios de cobro |
| **Finanzas (ERP-011)** | Hooks de notificación transaccional (FASE 25B) |
| **Reportes (ERP-014)** | KPIs de comunicación para análisis de respuesta y conversión |
| **Laboratorio IA (ERP-010)** | Clasificación, resúmenes y detección de oportunidades |
| **Email Marketing (ERP-018)** | Comparte infraestructura SES pero pool de IPs estrictamente separado |
| **HostingGuard (ERP-015)** | Casilla `hosting@inspyra.cloud` recibe consultas de clientes hosting |
| **Inspyra Cloud (ERP-016)** | Casilla `cloud@inspyra.cloud` recibe consultas cloud |

---

## Reglas críticas de negocio

### Regla 1 — Todo email entrante debe quedar registrado
Ningún email recibido en casillas corporativas puede existir fuera del ERP. Incluye spam — se registra como tal.

### Regla 2 — Todo email debe poder vincularse con contexto ERP
`Client Linking Bot` intenta vincular automáticamente. Si no puede → queda `client_id = null` para asignación manual. Nunca se bloquea el flujo.

### Regla 3 — Ninguna consulta web puede perderse
Cada envío de formulario web genera un `WebForm` y un `EmailMessage`. Si el procesamiento posterior falla → el `WebForm` queda con `procesado = false` y aparece en la vista de pendientes.

### Regla 4 — Toda automatización debe poder pausarse manualmente
Cualquier secuencia activa puede pausarse desde la ficha del contacto sin cancelarla. El equipo siempre tiene control manual sobre la automatización.

### Regla 5 — Secuencia se detiene si hay respuesta humana
Si el contacto responde en cualquier paso de una secuencia → `estado = respondio` → secuencia pausada inmediatamente. Nunca continuar una secuencia automática cuando hay conversación activa.

### Regla 6 — Todo historial se conserva
Los emails no se eliminan, solo se archivan. El historial de comunicación es permanente e inmutable.

### Regla 7 — Separación estricta con Email Marketing
`notifications@inspyra.cloud` y las casillas transaccionales usan SES con credenciales y pool de IPs distintos a los de campañas masivas. Un bounce en Email Marketing no puede afectar la reputación de Inspyra Mail.

---

## Criterios de aceptación (DoD)

Para que esta spec se considere implementada:

- [ ] Schema Prisma: `EmailMessage`, `EmailAttachment`, `EmailTemplate`, `EmailSequence`, `EmailSequenceEnrollment`, `WebForm`
- [ ] Ingesta de emails vía IMAP polling o webhook SES (SNS)
- [ ] Endpoint receptor de formularios web (`POST /api/mail/web-form`)
- [ ] Inbox General con sub-tabs: No leídos / Pendientes / Respondidos / Archivados / Spam
- [ ] 6 bandejas por área con routing automático
- [ ] Vista de conversaciones por cliente (accesible desde ERP-006)
- [ ] Vista de formularios web con estado de procesamiento
- [ ] CRUD de templates con variables de sustitución
- [ ] CRUD de secuencias con diseñador de pasos (delay + template + condición)
- [ ] Classification Bot con IA ≥ 90% de precisión en tipo de email
- [ ] Lead Detection Bot → crea prospecto en ERP-001
- [ ] Ticket Detection Bot → crea ticket en ERP-013
- [ ] Client Linking Bot por dominio/email
- [ ] Routing Bot por casilla destino y clasificación
- [ ] Follow-up Bot con umbral de inactividad configurable
- [ ] Escalation Bot con notificación al director
- [ ] Sequence Bot con lógica de parada por respuesta
- [ ] Resumen IA de email largo disponible con un clic
- [ ] Propuesta de respuesta IA con revisión antes de enviar
- [ ] Detección de riesgo churn en tono del cliente
- [ ] KPIs en tiempo real en el top del módulo
- [ ] Exportar historial de conversación de un cliente a PDF
- [ ] Tests unitarios ≥ 85% en servicios de clasificación y routing

---

## Próximos pasos

1. Aprobar esta spec
2. Crear `19-erp-018-email-marketing.md`
3. Definir configuración IMAP por casilla: credenciales en Secrets Manager, polling interval
4. Diseñar el receptor de webhooks SES para emails entrantes (SNS → endpoint)
5. Definir el diseñador visual de secuencias en el frontend
6. Especificar las variables disponibles en templates (`{{nombre}}`, `{{empresa}}`, `{{fecha}}`, `{{link_propuesta}}`, etc.)
7. Definir la integración con la bandeja de salida de Tickets (ERP-013 responde desde Inspyra Mail)
