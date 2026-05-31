# Inspyra ERP Constitution v1

**Spec ID:** 01  
**Estado:** ✅ APPROVED  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  
**Versión:** 1.0

---

## 1. Propósito del sistema

Inspyra ERP es el sistema operativo interno central de la agencia Inspyra.

Su propósito es centralizar toda la operación comercial, productiva, financiera, tecnológica y creativa de la empresa en una sola plataforma.

- No está diseñado inicialmente para acceso de clientes externos.
- Es una plataforma interna para uso exclusivo del equipo Inspyra.

Debe permitir administrar de forma ordenada:

- Captación de leads
- Seguimiento comercial
- Pipeline de ventas
- Reuniones comerciales
- Clientes activos
- Servicios vendidos
- Proyectos en ejecución
- Tareas internas
- Infraestructura HostingGuard
- Operación de Inspyra Cloud
- Facturación y finanzas
- Tickets internos y soporte
- Automatizaciones operativas
- Laboratorio IA multiagente

---

## 2. Principios fundamentales del producto

### Single Source of Truth

Toda información relevante de la agencia debe vivir dentro de Inspyra ERP.

No depender de múltiples herramientas externas desconectadas.

El ERP es la fuente central de verdad operativa.

---

### Modularidad

Cada área vive como módulo independiente.

Cada módulo puede evolucionar por separado.

Cada módulo se conecta con el resto mediante relaciones de datos y eventos internos.

---

### Escalabilidad

El sistema debe poder crecer sin necesidad de reescritura estructural.

Debe soportar:

- Más clientes
- Más usuarios internos
- Más servicios
- Más automatizaciones
- Más agentes IA
- Más servidores
- Más volumen operativo

---

### Automation First

Todo proceso repetitivo debe ser automatizable.

El ERP debe reducir tareas manuales siempre que sea posible.

Automatizar sin perder control humano.

---

### Human-in-the-loop

- La IA **propone**.
- La automatización **ejecuta**.
- El equipo **valida**.

Las decisiones críticas siempre pueden ser supervisadas manualmente.

---

### Cost-Aware AI

La inteligencia artificial debe ser rentable.

- Cada ejecución debe medirse.
- Cada agente debe registrar coste.
- Cada workflow debe poder auditarse económicamente.
- Toda IA usada debe aportar valor económico real.

---

### Full Traceability

Todo debe quedar registrado. Ejemplos:

- Quién creó un lead
- Quién respondió
- Quién movió pipeline
- Quién cerró cliente
- Qué bot respondió
- Qué agente IA generó contenido
- Cuánto costó esa ejecución
- Cuándo ocurrió

---

### Performance

La plataforma debe sentirse rápida.

Objetivo UX:

- Carga rápida
- Navegación inmediata
- Filtros ágiles
- Tablas fluidas
- Búsqueda global instantánea

---

### UX Consistency

Toda la experiencia debe mantener coherencia visual y funcional.

Misma lógica entre módulos: cards, filtros, tablas, status, acciones, modales, navegación.

---

## 3. Arquitectura general del negocio

### Núcleo central

**Inspyra ERP** — El cerebro operativo principal.

---

### Unidad satélite 1 — HostingGuard

Infraestructura de hosting y despliegue.

Incluye: deployments, subdominios, builds, SSL, logs, recursos, monitoreo, uptime.

---

### Unidad satélite 2 — Inspyra Cloud

Infraestructura cloud para clientes de mayor escala.

Incluye: AWS workloads, serverless, software clients, infraestructura dedicada, soluciones empresariales.

---

### Unidad satélite 3 — Inspyra Mail

Email profesional para clientes.

---

### Unidad satélite 4 — Inspyra Email Marketing

Automatización y envío de campañas email.

---

## 4. Stack tecnológico base

### Frontend

| Tecnología | Rol |
|---|---|
| React | UI framework |
| TypeScript | Tipado estático |
| Vite | Build tool |
| Tailwind CSS | Estilos |
| shadcn/ui | Componentes |

### Backend

| Tecnología | Rol |
|---|---|
| Node.js | Runtime |
| NestJS | Framework API |
| REST API | Protocolo |
| Event-driven architecture | Comunicación interna |

### Database

| Tecnología | Rol |
|---|---|
| PostgreSQL | Base de datos principal |
| Prisma ORM | Acceso y migraciones |

### Auth

| Tecnología | Rol |
|---|---|
| JWT | Autenticación |
| RBAC | Roles y permisos |

### Infraestructura

| Tecnología | Rol |
|---|---|
| AWS | Cloud principal |
| VPS propia | Hosting interno |
| HostingGuard infra | Deployments de clientes |
| Docker | Containerización |
| GitHub | Source of truth + CI/CD |

---

## 5. Módulos principales del ERP

### Comercial
- Prospectos
- Campañas
- Seguimiento
- Pipeline
- Reuniones

### Delivery
- Clientes
- Servicios
- Proyectos
- Tareas

### Studio
- Laboratorio IA

### Operations
- HostingGuard
- Inspyra Cloud
- Facturación / Finanzas
- Tickets
- Reportes

### Account
- Configuración
- Usuarios
- Roles
- Permisos
- Integraciones

---

## 6. Laboratorio IA

El Laboratorio IA es el módulo creativo-operativo avanzado.

Funciona como entorno multiagente especializado.

Los agentes pueden colaborar entre sí.

Existe un **Core Agent Orchestrator** que recibe el pedido y deriva al agente correcto.

### Agentes disponibles

| Agente | Responsabilidad |
|---|---|
| Marketing Agent | Estrategia y campañas |
| SEO Agent | Posicionamiento orgánico |
| Content Agent | Generación de contenido |
| Copywriting Agent | Copy persuasivo |
| Ads Agent | Campañas pagas |
| Web Strategy Agent | Estrategia web |
| Software Architecture Agent | Decisiones técnicas |
| Research Agent | Investigación y análisis |
| Financial Agent | Análisis financiero |

### Requisitos de cada agente

- Contexto
- Memoria operativa
- Coste medible
- Trazabilidad
- Logs de ejecución

---

## 7. Métrica financiera obligatoria para IA

Toda acción IA debe registrar los siguientes campos:

| Campo | Tipo | Descripción |
|---|---|---|
| `model` | string | Modelo usado (ej: claude-sonnet-4-6) |
| `provider` | string | Proveedor (ej: anthropic, openai) |
| `input_tokens` | int | Tokens de entrada |
| `output_tokens` | int | Tokens de salida |
| `unit_cost_usd` | decimal | Coste por 1k tokens |
| `total_cost_usd` | decimal | Coste total de la ejecución |
| `client_id` | uuid | Cliente asociado (nullable) |
| `workflow_id` | uuid | Workflow asociado (nullable) |
| `executed_at` | timestamp | Fecha y hora de ejecución |

---

## 8. Filosofía de desarrollo

```
Spec first
    ↓
Plan
    ↓
Tasks
    ↓
Build
```

**Nunca construir primero y pensar después.**

Toda nueva feature debe pasar por proceso spec-driven antes de entrar en desarrollo.

---

## 9. Próximas specs a definir

| Prioridad | Spec | Descripción |
|---|---|---|
| P0 | `02-data-model-v1.md` | Schema completo de base de datos (todas las entidades) |
| P0 | `03-auth-rbac-v1.md` | Sistema de autenticación y roles |
| P1 | `04-module-comercial-v1.md` | Spec completa del módulo Comercial |
| P1 | `05-module-delivery-v1.md` | Spec completa del módulo Delivery |
| P1 | `06-module-lab-ia-v1.md` | Spec completa del Laboratorio IA |
| P2 | `07-module-operations-v1.md` | HostingGuard, Facturación, Tickets |
| P2 | `08-api-design-v1.md` | Diseño de endpoints REST |
| P3 | `09-automation-engine-v1.md` | Motor de automatizaciones |
| P3 | `10-ai-cost-tracking-v1.md` | Sistema de tracking de costes IA |
