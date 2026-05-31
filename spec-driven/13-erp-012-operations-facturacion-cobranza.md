# ERP-012 — Operations / Facturación & Cobranza

**Spec ID:** 13  
**Código:** ERP-012  
**Módulo:** Operations → Facturación & Cobranza  
**Estado:** 🟡 DRAFT v1  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  

---

## Objetivo del módulo

El módulo Facturación & Cobranza administra todo el ciclo económico de emisión, seguimiento, cobro y conciliación financiera de los servicios vendidos por Inspyra.

Es el **centro de gestión financiera operativa** vinculado directamente a clientes y revenue.

Su objetivo es garantizar:

- Facturación ordenada y trazable
- Cobranza eficiente y automatizada
- Control de vencimientos sin intervención manual
- Seguimiento activo de deuda
- Trazabilidad total del dinero facturado y cobrado

---

## Qué resuelve

| Sin módulo | Con módulo |
|---|---|
| Facturas perdidas | Emisión centralizada y numerada |
| Clientes olvidados por cobrar | Control total de cobros por cliente |
| Vencimientos no controlados | Alertas y seguimiento automático |
| Pagos sin registrar | Cada pago conciliado con su factura |
| Deuda dispersa y sin visibilidad | Aging de deuda en tiempo real |
| Revenue poco confiable | Historial económico completo |

---

## Principio central

> **Todo servicio vendido debe poder facturarse y cobrarse desde el ERP.**

Cada servicio contratado debe poder convertirse en: factura → pago → seguimiento → registro histórico.

---

## Qué vive dentro del módulo

- Facturas emitidas, pendientes, cobradas, vencidas
- Notas de crédito
- Pagos parciales y completos
- Recordatorios de cobro y historial de cobranza
- Clientes morosos
- Suscripciones y billing recurrente
- Billing HostingGuard / Inspyra Cloud / Inspyra Mail / Email Marketing

---

## Qué NO vive aquí

| ❌ No aquí | ✅ Dónde va |
|---|---|
| Presupuestos y propuestas comerciales | Módulo Pipeline |
| Campañas y prospectos | Módulo Comercial |
| Proyectos internos | Módulo Proyectos |
| Gastos operativos | ERP-011 Finanzas |

---

## Flujo del ciclo de vida

```
Venta cerrada → Generación de factura → Emisión → Envío → Vencimiento → Cobro → Conciliación → Cierre
```

### Paso 1 — Venta cerrada
Cliente compra servicio. El evento `deal.won` puede disparar generación automática de factura.

### Paso 2 — Generación de factura
Manual desde la UI o automática vía `Invoice Generator Bot`.

### Paso 3 — Emisión
Factura queda en estado `emitida` con número correlativo (`INS-2026-XXXX`).

### Paso 4 — Envío
Se envía automáticamente por email (Inspyra Mail), descarga PDF o link de pago.

### Paso 5 — Seguimiento de vencimiento
Control automático: alertas a -7 días, el día del vencimiento, +7 y +30 días.

### Paso 6 — Cobro
Pago recibido por cualquier método habilitado.

### Paso 7 — Conciliación
Vinculación: `Factura ↔ Pago ↔ Cliente ↔ Servicio`. Estado pasa a `pagada`.

### Paso 8 — Cierre administrativo
Factura archivada. Revenue confirmado en Finanzas.

---

## Modelo de datos

### Invoice (Factura)

#### Identificación y origen

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único |
| `numero_factura` | string | Correlativo legible (`INS-2026-0001`) |
| `client_id` | uuid (FK Client) | Cliente facturado |
| `service_id` | uuid (FK Service) | Servicio facturado |
| `project_id` | uuid (FK Project) | Proyecto asociado (nullable) |
| `deal_id` | uuid (FK Deal) | Deal que originó esta factura (nullable) |
| `unidad_negocio` | enum | inspyra / hostingguard / inspyra_cloud / inspyra_mail / email_mkt |

#### Económico

| Campo | Tipo | Descripción |
|---|---|---|
| `descripcion` | text | Concepto de la factura |
| `subtotal_usd` | decimal | Base imponible |
| `descuentos_usd` | decimal | Descuentos aplicados |
| `impuestos_usd` | decimal | Impuestos (IVA u otros) |
| `total_usd` | decimal (calculado) | Importe final a cobrar |
| `moneda_original` | string | Moneda de emisión (USD, ARS, EUR…) |
| `tipo_cambio` | decimal | Tipo de cambio al momento de emisión |

#### Estado y fechas

| Campo | Tipo | Descripción |
|---|---|---|
| `estado` | enum | borrador / emitida / enviada / pendiente / pagada / parcial / vencida / cancelada |
| `fecha_emision` | date | Fecha de emisión |
| `fecha_vencimiento` | date | Fecha límite de pago |
| `fecha_cobro` | date | Fecha real de cobro (nullable) |

#### Archivos y cobro

| Campo | Tipo | Descripción |
|---|---|---|
| `pdf_url` | string | URL al PDF generado (nullable) |
| `link_pago` | string | URL del link de pago online (nullable) |
| `payment_id` | uuid (FK Payment) | Pago asociado al cobrar (nullable) |
| `observaciones` | text | Notas internas del equipo |
| `created_at` | timestamp | — |
| `updated_at` | timestamp | — |
| `created_by_id` | uuid (FK User) | Quién generó la factura |

---

### Payment (Pago)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `client_id` | uuid (FK) | Cliente que pagó |
| `invoice_id` | uuid (FK) | Factura pagada (nullable si pago a cuenta) |
| `fecha_pago` | date | Fecha real del pago |
| `monto_usd` | decimal | Monto pagado en USD |
| `moneda_original` | string | Moneda en que pagó el cliente |
| `tipo_cambio` | decimal | Tipo de cambio aplicado |
| `metodo_pago` | enum | transferencia / stripe / paypal / efectivo / hostingguard / aws_reimbursement / link_pago / otro |
| `referencia_externa` | string | ID de pasarela o número de comprobante (nullable) |
| `comprobante_url` | string | URL al comprobante adjunto (nullable) |
| `estado` | enum | recibido / pendiente_confirmacion / confirmado / rechazado / reembolsado |
| `notas` | text | Observaciones internas |
| `created_at` | timestamp | — |

---

### RecurringBilling (Facturación Recurrente)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `client_id` | uuid (FK) | Cliente |
| `service_id` | uuid (FK) | Servicio recurrente |
| `unidad_negocio` | enum | A qué unidad pertenece el billing |
| `importe_usd` | decimal | Importe del ciclo |
| `ciclo` | enum | mensual / trimestral / semestral / anual |
| `fecha_inicio` | date | Inicio del contrato |
| `proxima_emision_at` | date | Fecha de siguiente factura automática |
| `renovacion_automatica` | boolean | Si genera factura sin intervención |
| `estado` | enum | activa / pausada / cancelada |
| `dias_aviso_previo` | int | Con cuántos días de antelación enviar aviso (default: 7) |

---

### DebtRecord (Registro de Cobranza)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `invoice_id` | uuid (FK) | Factura en deuda |
| `client_id` | uuid (FK) | Cliente deudor |
| `dias_vencida` | int (calculado) | Días desde la fecha de vencimiento |
| `monto_pendiente_usd` | decimal | Monto aún no cobrado |
| `ultimo_contacto_at` | timestamp | Fecha de último contacto de cobranza |
| `proximo_seguimiento_at` | date | Fecha programada para siguiente acción |
| `intentos_cobro` | int | Cantidad de recordatorios enviados |
| `riesgo` | enum | bajo / medio / alto / incobrable |
| `notas_cobranza` | text | Log de acciones realizadas |

---

## Submódulos / Vistas

### 1. Dashboard Facturación
Vista ejecutiva con KPIs en tiempo real.

### 2. Facturas
Tabla general con filtros por estado, cliente, período, unidad de negocio. Acciones: emitir, enviar, marcar cobrada, cancelar.

### 3. Pagos
Tabla de pagos registrados con conciliación manual o automática a factura.

### 4. Cobranza
Vista operativa diaria: facturas por vencer, vencidas, aging, último contacto, siguiente acción.

### 5. Recurrentes
Suscripciones activas con próxima fecha de emisión, estado y historial de ciclos.

### 6. Morosidad
Panel de clientes con deuda vencida segmentado por antigüedad y riesgo estimado.

### 7. Historial financiero por cliente
Timeline económica completa: facturas, pagos, notas de crédito, contactos de cobranza.

---

## KPIs del módulo (siempre visibles)

| KPI | Cálculo | Alerta |
|---|---|---|
| Facturado hoy | SUM(total_usd) facturas emitidas hoy | — |
| Facturado mes | SUM(total_usd) facturas emitidas mes actual | vs mes anterior |
| Cobrado hoy | SUM(monto_usd) pagos confirmados hoy | — |
| Cobrado mes | SUM(monto_usd) pagos confirmados mes | vs meta |
| Pendiente de cobro | SUM(total_usd) facturas no pagadas | si > 20% del MRR |
| Facturas vencidas | COUNT facturas con estado `vencida` | si > 0 |
| Deuda total | SUM(monto_pendiente_usd) en DebtRecord | — |
| Morosidad % | (Deuda vencida / Revenue facturado) × 100 | si > 5% |
| Próximos vencimientos | COUNT facturas que vencen en 7 días | — |
| Cobranza recuperada | SUM cobros de facturas que estaban vencidas | — |
| Revenue recurrente activo | SUM(importe_usd) de RecurringBilling activas | — |
| Renovaciones próximas 30d | COUNT RecurringBilling con proxima_emision ≤ 30 días | — |

---

## Aging de deuda

| Tramo | Descripción | Riesgo |
|---|---|---|
| 0–7 días | Recién vencida | Bajo |
| 8–30 días | Atraso moderado | Medio |
| 31–60 días | Atraso significativo | Alto |
| 61–90 días | Moroso activo | Alto |
| +90 días | Riesgo de incobrabilidad | Crítico |

---

## Bots y automatizaciones

| Bot | Trigger | Acción |
|---|---|---|
| **Invoice Generator Bot** | `deal.won` o renovación automática activada | Genera factura con datos del servicio/cliente |
| **Renewal Billing Bot** | `proxima_emision_at` alcanzada en RecurringBilling | Genera y envía factura del ciclo |
| **Due Reminder Bot** | 7 días antes de `fecha_vencimiento` | Email al cliente + notificación interna al account manager |
| **Overdue Reminder Bot** | 1, 7, 15 y 30 días después del vencimiento | Email de cobranza al cliente + alerta interna escalando responsable |
| **Payment Confirmation Bot** | Pago recibido vía webhook (Stripe/pasarela) | Concilia pago ↔ factura, actualiza estado, notifica al cliente |
| **Retry Collection Bot** | Factura vencida + método de pago automático disponible | Reintenta cobro automático si hay tarjeta o débito activo |
| **Subscription Renewal Bot** | 3 días antes de `proxima_emision_at` | Avisa al cliente que se emitirá factura de renovación |
| **Debt Risk Bot** | Factura vencida > 30 días | Calcula riesgo, escala a nivel `alto`, notifica al director |
| **Mail Billing Bot** | Invoice `estado = emitida` | Envía factura PDF por Inspyra Mail automáticamente |

---

## Capacidades IA del módulo

| Función IA | Descripción |
|---|---|
| **Predicción de mora** | Detecta clientes con perfil de pago tardío histórico antes de que venzan |
| **Resumen financiero por cliente** | Estado de cuenta completo en 5 líneas: debe, pagó, historial |
| **Análisis de patrones de pago** | Cada cliente tiene un patrón: cuánto tarda en pagar, qué método usa |
| **Recomendación de acción de cobranza** | Dado el perfil del cliente, sugiere el tono y canal más efectivo |
| **Forecast de cobros próximos** | Proyecta cuánto ingresará en los próximos 30/60 días |
| **Detección de riesgo de incobrabilidad** | Señales tempranas basadas en comportamiento + sector + historial |
| **Resumen semanal de cobranza** | Informe automático lunes AM con deuda activa y prioridades |

Toda ejecución IA registra métricas de coste según `01-constitution-v1.md §7`.

---

## Relaciones con otros módulos

| Módulo | Relación |
|---|---|
| **Clientes** | Toda factura pertenece a un cliente — FK obligatorio |
| **Servicios** | Cada factura responde a un servicio vendido |
| **Finanzas (ERP-011)** | Cada cobro confirmado impacta el revenue real del dashboard financiero |
| **HostingGuard** | Billing recurrente por servidores y VPS |
| **Inspyra Cloud** | Billing recurrente por workloads cloud |
| **Inspyra Mail** | Envío automático de facturas y recordatorios |
| **Email Marketing** | Billing independiente por campañas |
| **Reportes** | Exportación de data financiera para reportes ejecutivos |

---

## Reglas críticas de negocio

### Regla 1 — Cliente obligatorio
Toda factura debe tener `client_id`. No puede existir factura sin cliente.

### Regla 2 — Estado siempre definido
Toda factura debe tener estado en todo momento. No puede estar en estado nulo.

### Regla 3 — Todo pago debe vincularse a una factura
Los pagos a cuenta sin factura son excepción — deben marcarse explícitamente como `pago_a_cuenta`.

### Regla 4 — Todo vencimiento debe poder rastrearse
La fecha de vencimiento es obligatoria en toda factura emitida. Sin fecha → factura bloqueada.

### Regla 5 — Todo cobro queda registrado históricamente
Los pagos nunca se eliminan — solo se anulan con registro de motivo. El historial es inmutable.

### Regla 6 — La facturación recurrente debe ser autónoma
Un servicio recurrente activo debe generar su factura sin intervención manual. Si falla el bot, alerta inmediata al equipo.

### Regla 7 — Toda deuda debe ser visible
Ninguna deuda puede quedar oculta. El panel de morosidad siempre refleja el estado real.

---

## Criterios de aceptación (DoD)

Para que esta spec se considere implementada:

- [ ] CRUD completo de Facturas con validaciones de campos obligatorios
- [ ] Numeración correlativa automática (`INS-YYYY-XXXX`) por unidad de negocio
- [ ] Generación de PDF descargable por factura
- [ ] CRUD de Pagos con conciliación manual a factura
- [ ] Webhook de Stripe para conciliación automática de pagos
- [ ] Módulo de Facturación Recurrente con configuración de ciclo y renovación automática
- [ ] Invoice Generator Bot disparado por `deal.won`
- [ ] Renewal Billing Bot emite facturas de ciclos recurrentes
- [ ] Due Reminder Bot -7 días antes del vencimiento
- [ ] Overdue Reminder Bot en 1/7/15/30 días post-vencimiento
- [ ] Payment Confirmation Bot vía webhook
- [ ] Panel de Cobranza con aging de deuda por tramos
- [ ] Panel de Morosidad con clasificación por riesgo
- [ ] Historial financiero completo por cliente
- [ ] KPIs siempre visibles en top bar del módulo
- [ ] Predicción de mora con IA basada en historial de pagos
- [ ] Envío automático de factura PDF por Inspyra Mail
- [ ] Multi-unidad de negocio (cada factura tiene su BU)
- [ ] Exportar facturas a CSV + PDF por período
- [ ] Auditoría de cambios de estado en facturas (append-only log)
- [ ] Tests unitarios ≥ 85% en servicios de facturación y conciliación

---

## Próximos pasos

1. Aprobar esta spec
2. Crear `14-erp-013-operations-tickets.md`
3. Definir schema Prisma: `Invoice`, `Payment`, `RecurringBilling`, `DebtRecord`
4. Diseñar endpoints REST: `/api/invoices`, `/api/payments`, `/api/billing/recurring`
5. Diseñar webhook Stripe: `payment_intent.succeeded` → Payment Confirmation Bot
6. Definir formato del PDF de factura (logo, datos fiscales, desglose)
7. Especificar integración con Inspyra Mail para envío automático de facturas
