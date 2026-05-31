# ERP-019 — Account / Configuración

**Spec ID:** 20  
**Código:** ERP-019  
**Módulo:** Account → Configuración  
**Estado:** 🟡 DRAFT v1  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  

---

## Objetivo del módulo

El módulo Configuración centraliza toda la administración global del ecosistema Inspyra.

Es el **panel maestro desde donde se gobierna el ERP completo**.

Permite configurar: negocio, usuarios, permisos, seguridad, integraciones, automatizaciones, plataformas satélite, agentes IA, branding y comportamiento global del sistema.

---

## Qué representa dentro del ecosistema

> Si el ERP es el cerebro operativo de Inspyra, Configuración es el **sistema nervioso central administrativo**.

Desde aquí se define cómo funciona toda la plataforma. Ningún otro módulo puede alterar su propio comportamiento sin que la configuración lo permita.

---

## Principio central

> **Todo parámetro global del sistema debe poder administrarse desde un solo lugar.**

Nada crítico debería quedar disperso fuera de este módulo. Toda configuración estratégica centralizada aquí.

---

## Qué vive dentro del módulo

- Usuarios internos, roles y permisos
- Configuración general de la empresa y branding
- Integraciones externas y plataformas satélite
- Automatizaciones globales y su estado
- Configuración de IA: presupuestos, modelos, agentes
- Seguridad: 2FA, sesiones, accesos, políticas
- Notificaciones globales del sistema
- Auditoría y logs completos

---

## Qué NO vive aquí

- Operación diaria (clientes, tareas, proyectos)
- Ejecución de servicios
- Creación de contenidos

Solo **gobierna** la configuración y administración global del sistema.

---

## Modelo de datos

### SystemConfig (Configuración global — singleton)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Siempre 1 registro |
| `nombre_comercial` | string | "Inspyra" |
| `razon_social` | string | Razón social legal |
| `logo_url` | string | URL logo principal |
| `logo_secundario_url` | string | URL logo secundario (nullable) |
| `favicon_url` | string | URL favicon (nullable) |
| `dominio_principal` | string | `inspyra.cloud` |
| `timezone` | string | `America/Argentina/Buenos_Aires` |
| `idioma_default` | string | `es` |
| `moneda_principal` | string | `USD` |
| `moneda_secundaria` | string | `ARS` (nullable) |
| `formato_fecha` | string | `DD/MM/YYYY` |
| `iva_pct` | decimal | Porcentaje IVA base |
| `impuestos_extra` | jsonb | Impuestos adicionales configurables |
| `datos_fiscales` | jsonb | CUIT, dirección fiscal, etc. |
| `updated_at` | timestamp | — |
| `updated_by_id` | uuid (FK User) | Quién hizo el último cambio |

---

### Integration (Integración externa)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `nombre` | enum | hostingguard / inspyra_cloud / inspyra_mail / email_mkt / aws / github / meta_ads / google_ads / stripe / whatsapp / google_calendar / otro |
| `display_name` | string | Nombre legible (ej: "HostingGuard API") |
| `estado` | enum | conectado / desconectado / error / configurando |
| `credenciales` | jsonb (encrypted) | Credenciales cifradas en reposo |
| `config` | jsonb | Configuración específica de cada integración |
| `ultima_sync_at` | timestamp | Última sincronización exitosa |
| `ultimo_error` | text | Último mensaje de error (nullable) |
| `ultimo_error_at` | timestamp | Cuándo ocurrió el último error (nullable) |
| `activa` | boolean | Si la integración está habilitada |
| `created_at` | timestamp | — |
| `updated_at` | timestamp | — |

---

### AutomationWorkflow (Workflow global)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `nombre` | string | Nombre descriptivo |
| `modulo_origen` | string | Módulo que lo dispara |
| `trigger` | string | Evento disparador |
| `pasos` | jsonb | Array de pasos: `[{tipo, config, on_error}]` |
| `activo` | boolean | Si está habilitado |
| `ejecuciones_totales` | int | COUNT histórico |
| `errores_totales` | int | COUNT de fallos |
| `ultima_ejecucion_at` | timestamp | — |
| `ultima_ejecucion_exitosa` | boolean | Estado de la última ejecución |
| `created_at` | timestamp | — |

---

### AIConfig (Configuración global de IA)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Siempre 1 registro |
| `proveedor_default` | enum | anthropic / openai / gemini / mistral |
| `modelo_default` | string | Ej: `claude-3-5-sonnet-20241022` |
| `modelo_fallback` | string | Modelo de respaldo si el default falla |
| `routing_inteligente` | boolean | Si el sistema selecciona modelo según tarea |
| `max_tokens_por_ejecucion` | int | Límite de tokens por llamada |
| `limite_usd_diario` | decimal | Budget diario global |
| `limite_usd_mensual` | decimal | Budget mensual global |
| `limite_usd_por_cliente` | decimal | Budget mensual máximo imputable a un cliente |
| `limite_usd_por_proyecto` | decimal | Budget mensual máximo por proyecto |
| `limite_usd_por_colaborador` | decimal | Budget mensual por usuario |
| `alerta_sobrecoste_pct` | decimal | % del budget al que se alerta (ej: 80) |
| `approval_required_over_usd` | decimal | Ejecuciones sobre este monto requieren aprobación |
| `agentes_habilitados` | string[] | Lista de agentes activos |
| `updated_at` | timestamp | — |

---

### SecurityConfig (Configuración de seguridad)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Siempre 1 registro |
| `require_2fa` | boolean | Si 2FA es obligatorio para todos |
| `jwt_expiration_minutes` | int | Duración del JWT (default: 60) |
| `refresh_token_days` | int | Duración del refresh token (default: 30) |
| `session_timeout_minutes` | int | Inactividad antes de cerrar sesión |
| `min_password_length` | int | Longitud mínima contraseña |
| `require_uppercase` | boolean | Requerir mayúscula |
| `require_numbers` | boolean | Requerir número |
| `require_special_chars` | boolean | Requerir carácter especial |
| `max_login_attempts` | int | Intentos fallidos antes de bloquear (default: 5) |
| `lockout_minutes` | int | Minutos de bloqueo tras exceder intentos |
| `ip_allowlist` | string[] | IPs permitidas (vacío = todas) |
| `trusted_devices_enabled` | boolean | Si habilita dispositivos de confianza |

---

### AuditLog (Log de auditoría — append-only)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `actor_id` | uuid (FK User) | Quién realizó la acción |
| `actor_ip` | string | IP desde donde actuó |
| `actor_user_agent` | string | Browser / cliente |
| `accion` | enum | crear / editar / eliminar / aprobar / acceder / exportar / login / logout / config_change / permission_change / integration_event / automation_run / ai_execution |
| `modulo` | string | Módulo donde ocurrió |
| `entity_type` | string | Tipo de entidad afectada |
| `entity_id` | uuid | ID de la entidad afectada (nullable) |
| `cambios` | jsonb | `{antes: {...}, despues: {...}}` para ediciones |
| `descripcion` | text | Texto legible de la acción |
| `severidad` | enum | info / warning / critical |
| `created_at` | timestamp | — |

> `AuditLog` es la entidad más importante del módulo. Todo evento sensible del sistema genera una entrada aquí. Es **append-only e inmutable** — ningún registro puede modificarse ni eliminarse.

---

### NotificationConfig (Configuración de notificaciones)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `user_id` | uuid (FK User) | Configuración por usuario |
| `canal_email` | boolean | Recibir alertas por email |
| `canal_erp` | boolean | Recibir alertas dentro del ERP |
| `resumen_diario` | boolean | Recibir resumen diario |
| `resumen_semanal` | boolean | Recibir resumen semanal |
| `alertas_criticas_inmediatas` | boolean | Siempre enviar alertas críticas |
| `tipos_habilitados` | string[] | Lista de tipos de notificación suscritos |

---

## Estructura interna — Secciones del módulo

### Sección 1 — Configuración General del Negocio
Formulario de datos globales: nombre, razón social, branding (logo/favicon), zona horaria, idioma, moneda, formato de fecha, datos fiscales e impuestos configurables.

### Sección 2 — Usuarios
Tabla completa de usuarios con: nombre, email, cargo, área, rol, estado, último acceso, IP. Acciones: crear, editar, desactivar, bloquear, reset password, forzar logout, cambiar rol.

### Sección 3 — Roles & Permisos
Matrix de permisos. Eje X: módulos del ERP. Eje Y: roles. Celdas: acciones posibles (ver / crear / editar / aprobar / exportar / eliminar / administrar). Editable por `super_admin`.

**Módulos incluidos en la matrix:**
Dashboard · Comercial · Prospectos · Campañas · Pipeline · Clientes · Servicios · Proyectos · Tareas · Lab IA · Finanzas · Facturación · Cobranza · Tickets · Reportes · HostingGuard · Inspyra Cloud · Inspyra Mail · Email Mkt · Equipo · Configuración

### Sección 4 — Integraciones
Panel de tarjetas por integración. Cada tarjeta muestra: estado, última sync, último error, botones reconectar/desconectar. Click → configuración detallada con credenciales + logs de conexión.

**Integraciones soportadas:**

| Integración | Datos sincronizados |
|---|---|
| **HostingGuard** | Clientes, deployments, SSL, billing, health |
| **Inspyra Cloud** | Workloads, entornos, costos AWS, alertas |
| **Inspyra Mail** | SMTP, inbox routing, auto-reply status |
| **Email Marketing Engine** | Delivery, queues, dominios envío, reputación |
| **AWS** | Cost Explorer, CloudWatch, SES |
| **GitHub** | Repos vinculados, webhooks de deploy |
| **Meta Ads** | Cuentas publicitarias conectadas |
| **Google Ads** | Cuentas publicitarias conectadas |
| **Stripe** | Pagos, suscripciones, webhooks |
| **WhatsApp Business API** | Mensajería (futuro) |
| **Google Calendar** | Reuniones, sincronización de agenda |

### Sección 5 — Automatizaciones Globales
Lista de todos los workflows con estado, última ejecución, tasa de éxito. Acciones: activar/pausar, editar, reiniciar, duplicar, ver historial de ejecuciones. Los bots de todos los módulos se gestionan centralmente desde aquí.

### Sección 6 — Configuración IA
Formulario de `AIConfig` con presupuestos, modelos y routing. Lista de agentes habilitados/deshabilitados con su coste estimado mensual. Historial de consumo con gráfico de tendencia.

### Sección 7 — Seguridad
Formulario de `SecurityConfig`. Panel de sesiones activas con opción de forzar logout individual o global. Log de intentos fallidos y bloqueos. IP allowlist editable.

### Sección 8 — Notificaciones
Configuración por usuario de canales y tipos de alerta. Plantillas de resúmenes diarios y semanales.

### Sección 9 — Auditoría & Logs
Tabla de `AuditLog` con filtros por: usuario, módulo, acción, severidad, fecha. Exportable a CSV. Vista de diff `{antes, despues}` para cambios de configuración. **Inmutable — ningún registro puede eliminarse ni modificarse desde la UI.**

### Sección 10 — Plataformas Satélite
Panel de estado consolidado de las 4 unidades satélite con health indicators, última sync y acceso rápido a su sección de Integraciones.

| Plataforma | Indicadores |
|---|---|
| **HostingGuard** | Conectado · Health · Última sync · Clientes sync · Billing sync |
| **Inspyra Cloud** | Conectado · Infra health · AWS sync · Costos sync · Workloads |
| **Inspyra Mail** | SMTP activo · Inbox operativo · Routing activo · Auto-reply |
| **Email Marketing** | Delivery engine · Queues activas · Dominios envío · Reputación sender |

---

## KPIs del módulo (siempre visibles)

| KPI | Fuente | Alerta |
|---|---|---|
| Usuarios activos | COUNT User estado activo | — |
| Usuarios online ahora | TeamPresence | — |
| Integraciones conectadas | COUNT Integration estado `conectado` | — |
| Integraciones con error | COUNT estado `error` | si > 0 |
| Automatizaciones activas | COUNT AutomationWorkflow activo | — |
| Automatizaciones con fallo | COUNT última ejecución fallida | si > 0 |
| Agentes IA activos | COUNT en AIConfig.agentes_habilitados | — |
| Consumo IA mensual | SUM AIExecution del mes | si > 80% del límite |
| Últimos eventos seguridad | AuditLog accion=login + severidad crítica | si existen críticos |
| Últimos cambios config | AuditLog accion=config_change últimas 24h | — |

---

## Bots y automatizaciones del módulo

| Bot | Trigger | Acción |
|---|---|---|
| **User Provisioning Bot** | Nuevo colaborador creado en ERP-018 | Crea usuario ERP + asigna rol por área |
| **Permission Audit Bot** | Ejecución semanal | Detecta usuarios con permisos que no corresponden a su rol y genera reporte |
| **API Health Check Bot** | Cada 5 min | Verifica estado de todas las integraciones; crea alerta si alguna falla |
| **Security Alert Bot** | Login fallido > `max_login_attempts` o IP desconocida | Notifica al super_admin + bloquea si corresponde |
| **IA Cost Alert Bot** | Consumo IA supera `alerta_sobrecoste_pct` del budget | Alerta al director + bloquea nuevas ejecuciones si supera el 100% |
| **Failed Sync Alert Bot** | Integración sin sync exitosa > 30 min | Alerta al equipo técnico + registra en AuditLog |
| **Backup Config Bot** | Cada 24h | Exporta `SystemConfig` + `AIConfig` + `SecurityConfig` a S3 como backup cifrado |
| **Audit Summary Bot** | Lunes 9:00 AM | Resumen semanal de cambios de configuración, accesos y eventos de seguridad |

---

## Capacidades IA del módulo

| Función IA | Descripción |
|---|---|
| **Detección de permisos peligrosos** | Identifica roles con acceso a módulos sensibles que no deberían tenerlo |
| **Detección de configuraciones inconsistentes** | Ej: integración activa con credenciales vencidas, agente IA sin presupuesto asignado |
| **Análisis de riesgo de seguridad** | Usuarios sin 2FA en roles críticos, sesiones muy largas, IPs nuevas |
| **Resumen de actividad administrativa** | Qué cambió esta semana en el sistema con impacto estimado |
| **Detección de errores de integración** | Analiza patrones de fallo en API Health Check y sugiere causa probable |
| **Optimización de presupuesto IA** | Basado en consumo histórico, sugiere redistribución de budgets por módulo |

Toda ejecución IA registra métricas de coste según `01-constitution-v1.md §7`.

---

## Relaciones con otros módulos

| Módulo | Relación |
|---|---|
| **Todos los módulos** | Configuración es la capa transversal que define qué puede hacer cada módulo |
| **Equipo (ERP-018)** | Usuarios y roles definidos aquí se sincronizan con perfiles del equipo |
| **Laboratorio IA (ERP-010)** | `AIConfig` define los límites que `Budget Guard` del Lab IA respeta |
| **HostingGuard (ERP-015)** | Credenciales y config de la integración gestionadas aquí |
| **Inspyra Cloud (ERP-016)** | Credenciales AWS y config de la integración cloud |
| **Inspyra Mail (ERP-017)** | SMTP config y routing de casillas |
| **Reportes (ERP-014)** | `AuditLog` exportable para auditoría externa |

---

## Reglas críticas de negocio

### Regla 1 — Acceso restringido a `super_admin` y `direccion`
Solo estos dos roles pueden acceder al módulo Configuración en su totalidad. Los demás roles solo pueden ver sus preferencias personales (notificaciones, contraseña).

### Regla 2 — Todo cambio queda auditado
Cualquier modificación en `SystemConfig`, `Integration`, `AIConfig`, `SecurityConfig` o roles/permisos genera un `AuditLog` con diff `{antes, despues}`. Sin excepción.

### Regla 3 — AuditLog es inmutable
Ningún registro del log de auditoría puede modificarse ni eliminarse desde la UI ni desde la API. Solo append. Esto es un invariante de arquitectura.

### Regla 4 — Toda integración debe mostrar estado
No puede existir una integración configurada cuyo estado sea desconocido. Si la API Health Check no puede determinar el estado → `estado = error`.

### Regla 5 — Toda configuración crítica puede revertirse
`SystemConfig`, `AIConfig` y `SecurityConfig` mantienen historial de versiones en S3 (via `Backup Config Bot`). Cualquier configuración puede restaurarse al estado de cualquier día.

### Regla 6 — Credenciales siempre cifradas en reposo
El campo `credenciales` de `Integration` se almacena cifrado con AES-256. Nunca se devuelve en texto plano via API — solo se permite "reconectar" (sobrescribir) o "desconectar".

### Regla 7 — Budget IA es un hard limit
Cuando el consumo IA mensual alcanza el 100% del `limite_usd_mensual` en `AIConfig`, nuevas ejecuciones quedan bloqueadas hasta que el director aumente el límite manualmente. No es una advertencia — es un bloqueo real.

---

## Criterios de aceptación (DoD)

Para que esta spec se considere implementada:

- [ ] Schema Prisma: `SystemConfig`, `Integration`, `AutomationWorkflow`, `AIConfig`, `SecurityConfig`, `AuditLog`, `NotificationConfig`
- [ ] Sección Configuración General con todos los campos y validaciones
- [ ] CRUD de usuarios con todas las acciones (crear, desactivar, bloquear, reset pw, forzar logout, cambiar rol)
- [ ] Matrix de permisos RBAC por módulo y rol — editable por super_admin
- [ ] Panel de integraciones con estado en tiempo real para las 11 integraciones soportadas
- [ ] Sección Automatizaciones con control centralizado de todos los workflows del ERP
- [ ] `AIConfig` completo con hard limit de presupuesto operativo
- [ ] `SecurityConfig` con todas las políticas de acceso
- [ ] `AuditLog` append-only con diff visual de cambios de configuración
- [ ] Panel de Plataformas Satélite con estado consolidado de las 4 unidades
- [ ] API Health Check Bot cada 5 min sobre todas las integraciones
- [ ] Security Alert Bot con bloqueo automático por intentos fallidos
- [ ] IA Cost Alert Bot con bloqueo hard al 100% del budget
- [ ] Backup Config Bot diario a S3 cifrado
- [ ] Audit Summary Bot semanal
- [ ] Credenciales de integraciones cifradas en reposo (AES-256)
- [ ] Restauración de configuración desde backup S3
- [ ] Exportar AuditLog a CSV por período y filtros
- [ ] Tests unitarios ≥ 85% en servicios de permisos y auditoría

---

## Próximos pasos

1. Aprobar esta spec — cierra el módulo Account
2. Crear el **Unified Data Model spec** — schema Prisma completo de todas las entidades del ERP
3. Crear el **API Design spec** — endpoints REST para todos los módulos
4. Definir el cifrado de credenciales: KMS vs aplicación-level AES-256
5. Especificar el mecanismo de "restaurar configuración" desde backup S3
6. Definir la carga inicial (seed) de roles y permisos para el primer deploy
