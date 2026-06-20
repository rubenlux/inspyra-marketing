# INSPYRA Mail — Especificación de Integración

> Auditada en producción · Junio 2026  
> Esta spec reemplaza versiones anteriores.

## Resumen

INSPYRA Mail provee envío transaccional, templates Handlebars, sender profiles, activity log, API keys, webhooks, provisioning de mailboxes, IMAP/SMTP, webmail integrado y API de lectura de mensajes IMAP.

---

## Autenticación

| Uso | Método |
|-----|--------|
| Envío público (`/v1/public/mail/*`) | `Authorization: Bearer im_live_...` |
| API privada (lectura, mailboxes, etc.) | `Authorization: Bearer <Cognito JWT>` + `x-organization-id: <tenantId>` |

---

## Envío

### HTML libre
```
POST /v1/public/mail/send
{ "to", "subject", "html", "from"?, "externalReference"?, "externalType"? }
```

### Template Handlebars
```
POST /v1/public/mail/send-template
{ "to", "templateName", "templateVars": { ... } }
```

---

## Lectura de mensajes IMAP

```
GET /v1/mail/messages?email=usuario@inspyra.cloud&folder=inbox&limit=50
→ { "items": [...] }
```

```
GET /v1/mail/folders?email=usuario@inspyra.cloud
→ { "items": [...] }
```

Auth: Cognito JWT.

---

## Historial outbound (enviados por API)

```
GET /v1/messages?limit=50&status=?&from=?&to=?&offset=?
→ { "data": [...], "meta": { "total", "limit", "offset" } }
```

Auth: Cognito JWT + `x-organization-id`.

---

## Gestión de mailboxes

```
GET    /v1/mail/mailboxes
POST   /v1/mail/mailboxes          { "localPart", "quotaMB" }
GET    /v1/mail/mailboxes/:id
PATCH  /v1/mail/mailboxes/:id
DELETE /v1/mail/mailboxes/:id
POST   /v1/mail/mailboxes/:id/reset-password
```

Al crear un mailbox, la contraseña se devuelve una sola vez — guardar inmediatamente.

---

## API Keys

```
GET    /v1/mail/api-keys
POST   /v1/mail/api-keys
DELETE /v1/mail/api-keys/:id
```

---

## Webhooks

```
GET    /v1/mail/webhooks
POST   /v1/mail/webhooks
PUT    /v1/mail/webhooks/:id
DELETE /v1/mail/webhooks/:id
```

Firma: `X-Inspyra-Signature` (HMAC SHA256).

---

## Activity Log

```
GET /v1/mail/activity
```

---

## Configuración IMAP/SMTP

| Parámetro | Valor |
|-----------|-------|
| Servidor  | `mail.inspyra.cloud` |
| IMAP puerto | `993` (SSL/TLS) |
| SMTP puerto | `587` (STARTTLS) |

---

## Mailboxes activos (Inspyra)

| Dirección | Display name | Uso |
|-----------|-------------|-----|
| `contacto@inspyra.cloud` | Inspyra Servicios | Outreach comercial principal |
| `soporte@inspyra.cloud` | Inspyra Soporte | Atención al cliente |
| `hola@inspyra.cloud` | Inspyra Hola | Comunicaciones generales |

---

## Implementación en el ERP

- **Envío** (`mail-api.client.ts`): usa `MAIL_API_KEY` Bearer token.
- **Lectura proxy** (`outreach.service.ts`): forwarding del JWT del usuario vía `GET /outreach/mail/messages`, `/folders`, `/outbound`.
- **Base URL**: derivada de `MAIL_API_URL` en runtime con `new URL(url).origin`.
- **InspyraMail** (`ERPPrototype.tsx`): componente integrado, NO es una página nueva.
