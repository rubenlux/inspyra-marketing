# 05 — Reglas del Proposal Engine

---

## Tipos de propuesta

El sistema maneja dos tipos de propuesta con objetivos y reglas distintas:

| Tipo | Enum | Objetivo | Cuándo se genera |
|---|---|---|---|
| Outreach Brief | `OUTREACH` | Generar interés inicial, conseguir respuesta | Antes del primer contacto |
| Commercial Proposal | `COMMERCIAL` | Presentar solución completa con pricing | Después de una reunión o respuesta positiva |

**No son intercambiables.** Usar el tipo equivocado en el momento equivocado rompe el flujo comercial.

---

## Outreach Brief — Reglas

### Propósito

El Outreach Brief es el guión del primer contacto. Contiene:
- Contexto del prospecto
- Oportunidad detectada
- Mensaje sugerido para el operador

**No es** el mensaje que se le envía directamente al prospecto. **Es** la guía para que el operador construya ese mensaje.

### Restricciones de contenido

- **NO** pedir reunión inmediata ("¿Agendamos una call?")
- **NO** presentar pricing en el primer mensaje
- **NO** pedir branding o información extensa
- **NO** listar todos los servicios de la agencia
- **NO** usar lenguaje genérico que no mencione el negocio específico del prospecto

### Qué debe incluir

- **SÍ** una observación específica sobre el negocio del prospecto (web, IG, problema detectado)
- **SÍ** una sola oportunidad señalada de forma concreta
- **SÍ** un CTA de baja fricción ("¿Te interesa que te cuente más?")
- **SÍ** tono acorde al mercado (ver `04-commercial-rules.md`)

### Modelo de datos

```
ProposalType.OUTREACH
Campos clave: outreachMessage, outreachBrief, callToAction, communicationLanguage
Idioma: communicationLanguage del prospecto (EN, ES, PT, FR, DE)
```

---

## Commercial Proposal — Reglas

### Propósito

La Commercial Proposal presenta la solución completa después de que hay interés confirmado. Contiene:
- Resumen ejecutivo del problema del cliente
- Propuesta de solución detallada
- Paquetes con pricing (3 tiers)
- CTA para cerrar

### Estructura de paquetes

Siempre 3 opciones cuando aplique:

```
Esencial  — entrada de bajo riesgo, funcionalidades core
Crecimiento — el tier recomendado, balance precio/valor
Completo  — suite completa, para clientes con mayor presupuesto
```

Si el servicio no tiene variantes (ej: un servicio único de auditoría), puede presentarse sin tiers pero con una descripción clara de entregables.

### Restricciones

- **NO** generar Commercial Proposal sin que el prospecto haya respondido o aceptado una reunión
- **NO** mezclar propuesta de outreach con propuesta comercial en el mismo documento
- **NO** incluir precios inventados — deben venir del catálogo de servicios configurado

### Modelo de datos

```
ProposalType.COMMERCIAL
Campos clave: resumen, propuesta, paquetes (JSON), callToAction, communicationLanguage
```

---

## Ciclo de vida de una propuesta

```
ProposalStatus.DRAFT    — generada por el Proposal Agent, pendiente de revisión humana
ProposalStatus.APPROVED — operador humano la aprobó, lista para usar
ProposalStatus.REJECTED — operador humano la rechazó, se regenera o se descarta
```

**Invariante:** Solo un humano puede mover una propuesta de DRAFT a APPROVED. El agente siempre genera en DRAFT.

---

## Idioma de las propuestas

Las propuestas se generan en el idioma del prospecto (`communicationLanguage`):

| Valor | Idioma |
|---|---|
| `EN` | English |
| `ES` | Español |
| `PT` | Português |
| `FR` | Français |
| `DE` | Deutsch |

El operador trabaja en español. Si la propuesta está en otro idioma, puede solicitar traducción al español mediante el endpoint `POST /proposals/translate` (ERP-031). La traducción es una vista auxiliar — la fuente de verdad sigue siendo el idioma original del prospecto.

---

## Regeneración

Una propuesta puede regenerarse con el endpoint `POST /proposals/:id/regenerate`. Cada regeneración crea una nueva versión (campo `parentProposalId` apunta a la anterior). El historial de versiones se conserva.

---

## Proposal Agent — restricciones

- El Proposal Agent genera SIEMPRE en estado DRAFT
- No puede aprobarse a sí mismo
- No puede modificar datos del prospecto
- Solo puede crear o actualizar registros de tipo `Proposal`
- Usa `communicationLanguage` del prospecto para determinar el idioma de output
