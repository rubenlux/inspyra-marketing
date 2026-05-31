# ERP-023 — Backend Core Foundation

# Nombre

ERP-023 — Backend Core Foundation

# Estado

Draft v1

---

# Objetivo

Construir la base técnica completa del backend de Inspyra ERP sobre la que funcionará todo el ecosistema.

Esta spec define:

* arquitectura backend
* modelo base de datos
* autenticación
* permisos
* tenancy
* APIs base
* workers
* colas
* storage
* email services
* logging
* observabilidad
* infraestructura transversal compartida

Todo módulo futuro dependerá de esta base.

---

# Stack tecnológico oficial

## Runtime

Node.js 22 LTS

---

## Framework

NestJS

---

## Lenguaje

TypeScript strict mode

---

## ORM

Prisma ORM

---

## Database

PostgreSQL 16+

---

## Cache / Queue

Redis

BullMQ

---

## Auth

JWT + Refresh Token

Argon2

---

## API

REST API

JSON

versionado `/api/v1`

---

## Documentation

Swagger interno (solo dev / staging)

---

## File Storage

S3-compatible abstraction layer

Compatible con:

* MinIO
* Cloudflare R2
* AWS S3

---

## Email Layer

SMTP abstraction layer

Compatible con:

* Inspyra Mail
* Mailcow
* Resend
* SMTP relay externo

---

# Arquitectura

## Monolith modular

Backend construido como:

modular monolith

No microservicios inicialmente.

---

# Estructura

```bash id="h7rw9e"
apps/api

src/

modules/
common/
config/
database/
auth/
queue/
storage/
mail/
audit/
logging/
health/
events/
workers/
```

---

# Módulos base obligatorios

## auth

login

logout

refresh token

forgot password

reset password

verify email

session revoke

MFA futuro compatible

---

## users

usuarios internos

---

## tenants

tenant principal agencia

multi-tenant future-ready

---

## roles

RBAC completo

---

## permissions

ACL granular

---

## clients

clientes

---

## brands

marcas

---

## projects

proyectos

---

## tasks

tareas

---

## files

assets / uploads

---

## comments

comentarios internos

comentarios cliente portal

---

## notifications

notificaciones sistema

---

## audit

audit trail

---

## activity log

timeline completa

---

## integrations

social connectors

API connectors

MCP connectors

---

# Base de datos — entidades core

Schema inicial Prisma:

---

User

---

Tenant

---

Role

---

Permission

---

UserSession

---

Client

---

Brand

---

Project

---

Task

---

Comment

---

Notification

---

ActivityLog

---

AuditLog

---

Tag

---

Attachment

---

Integration

---

WebhookEvent

---

ApiToken

---

SystemSetting

---

FeatureFlag

---

# Reglas obligatorias

## UUID

Todas las entidades usan:

UUID v4

No IDs incrementales públicos.

---

# timestamps

Todas incluyen:

```ts id="if5dpo"
createdAt
updatedAt
deletedAt nullable
```

---

# soft delete

Modelo preferido:

soft delete

No hard delete salvo casos excepcionales.

---

# multi-tenant

Toda entidad tenant-aware incluye:

```ts id="g4y6go"
tenantId
```

---

# API estándar

Base URL:

```bash id="s6ijlk"
/api/v1
```

---

Formato respuesta:

```json id="h0y5vq"
{
  "success": true,
  "data": {},
  "meta": {},
  "error": null
}
```

---

Errores:

```json id="u5nxm5"
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request"
  }
}
```

---

# Auth architecture

Implementar:

---

Access token JWT corto

---

Refresh token rotativo

---

Argon2 password hashing

---

HttpOnly secure cookies cuando aplique

---

Session revocation

---

Multi-device sessions

---

Device tracking

---

IP tracking

---

Last login metadata

---

Suspicious login detection futuro-ready

---

# RBAC

Sistema de permisos granular.

Ejemplo:

```ts id="xj9qmu"
clients.read
clients.write
clients.delete

projects.read
projects.write
projects.delete

billing.read
billing.manage

team.manage

settings.manage
```

---

# Queue system

BullMQ obligatorio.

Colas previstas:

---

emails

---

notifications

---

imports

---

exports

---

webhooks

---

AI jobs

---

scheduled content publishing

---

social sync

---

analytics processing

---

report generation

---

# Storage layer

Abstracción única:

```ts id="8u5r4j"
storageService.upload()
storageService.delete()
storageService.getSignedUrl()
```

---

Compatible con:

MinIO

Cloudflare R2

AWS S3

---

# Logging

Structured logging obligatorio.

Campos mínimos:

```json id="1v4j1t"
requestId
userId
tenantId
ip
route
method
duration
statusCode
timestamp
```

---

# Audit Trail

Registrar obligatoriamente:

---

login

---

logout

---

password reset

---

billing changes

---

resource delete

---

permission changes

---

client approval

---

project publication

---

admin actions

---

# Healthcheck endpoints

Internos:

```bash id="yxttqo"
/health
/health/db
/health/redis
/health/storage
/health/queue
```

---

# Integración futura

Debe quedar listo para conectar:

---

HostingGuard

---

Inspyra Cloud

---

Inspyra Mail

---

Email Marketing Engine

---

AI Lab

---

MCP Claude

---

Social Publishing Engine

---

Client Portal

---

# Testing obligatorio

Cobertura mínima:

---

unit tests

---

integration tests

---

API tests

---

security tests

---

auth tests

---

permission tests

---

tenant isolation tests

---

file upload tests

---

worker tests

---

queue tests

---

# Resultado esperado

Al finalizar esta spec debe existir:

---

backend NestJS funcionando localmente

---

PostgreSQL conectado

---

Redis conectado

---

Prisma migrations funcionando

---

Auth funcionando

---

RBAC funcionando

---

estructura modular creada

---

primeros endpoints disponibles

---

Swagger interno disponible

---

healthchecks activos

---

docker compose operativo

---

backend listo para empezar a conectar módulos ERP uno por uno
