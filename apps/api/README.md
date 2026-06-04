# Inspyra ERP — Backend API

NestJS + Prisma + PostgreSQL 16 — modular monolith spec-driven.

## Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js 22 LTS |
| Framework | NestJS 10 |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Cache/Queue | Redis 7 (BullMQ — próxima fase) |
| Auth | JWT + Argon2 |
| Docs | Swagger `/docs` |

## Módulos implementados

| Módulo | Spec | Endpoints |
|---|---|---|
| Auth | ERP-023 | POST /auth/register, /login, /refresh, /logout — GET /auth/me |
| Users | ERP-023 | CRUD + deactivate |
| Prospects | ERP-001 | CRUD + KPIs + state machine + archive/discard |
| Deals / Pipeline | ERP-004 | CRUD + Kanban + move-stage (auditado) + KPIs + forecast |
| Clients | ERP-006 | CRUD + contacts + KPIs + status change |
| Services | ERP-007 | CRUD + deliverables + KPIs + margin calc |
| Service Catalog | ERP-007 | CRUD catálogo de precios |
| Health | ERP-023 | GET /health, /health/db |

## Setup local

### 1. Levantar infraestructura

```bash
# Desde la raíz del proyecto
docker compose up -d
```

### 2. Instalar dependencias

```bash
cd apps/api
npm install
```

### 3. Variables de entorno

```bash
cp .env.example .env
# Editar .env si cambiaste contraseñas en docker-compose.yml
```

### 4. Migrations + seed

```bash
npm run prisma:migrate    # crea las tablas
npm run prisma:seed       # datos iniciales (admin + catálogo)
```

### 5. Levantar el servidor

```bash
npm run start:dev
```

API disponible en: `http://localhost:3001/api/v1`  
Swagger docs: `http://localhost:3001/docs`

## Credenciales seed

```
Email:    admin@inspyra.io
Password: Admin1234!
```

## Estructura de respuesta

Todas las respuestas siguen el formato:

```json
{ "success": true, "data": {}, "meta": {}, "error": null }
```

Errores:

```json
{ "success": false, "data": null, "error": { "code": "NOT_FOUND", "message": "...", "path": "/api/v1/...", "timestamp": "..." } }
```

## Próxima fase — OpenClaw como capa de agentes

Una vez que el sistema CRUD funcione correctamente:

1. Prospect Discovery Agent — busca empresas según prompt
2. Enrichment Agent — completa datos faltantes
3. Scoring Agent — calcula score 0-100
4. Stalled Deal Bot — detecta deals estancados
5. Client Health Bot — recalcula health score diario
