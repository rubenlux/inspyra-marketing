# SEC-003 — Incident Response

**Estado:** Draft v1

---

## Objetivo

Definir como Inspyra detecta, clasifica, contiene, investiga, comunica y cierra incidentes de seguridad.

Esta spec complementa:

- `SEC-001-security-baseline.md` — controles preventivos.
- `SEC-002-security-testing.md` — verificacion de controles.

---

## Alcance

Aplica a incidentes en:

- frontend;
- backend;
- infraestructura;
- base de datos;
- secretos;
- CI/CD;
- MCP servers;
- agentes IA;
- integraciones externas;
- billing;
- datos de clientes;
- cuentas internas.

---

## Severidades

| Severidad | Criterio |
|---|---|
| SEV-1 | Exposicion confirmada de datos, credenciales o control no autorizado de sistemas productivos. |
| SEV-2 | Acceso indebido probable, vulnerabilidad explotable critica o caida de servicio sensible. |
| SEV-3 | Vulnerabilidad importante sin evidencia de explotacion o incidente contenido. |
| SEV-4 | Hallazgo menor, hardening pendiente o evento sospechoso sin impacto confirmado. |

---

## Flujo Obligatorio

1. Detectar y registrar el evento.
2. Clasificar severidad.
3. Contener impacto.
4. Preservar evidencia.
5. Erradicar causa raiz.
6. Recuperar servicio.
7. Comunicar a stakeholders segun impacto.
8. Crear postmortem.
9. Crear tareas preventivas.
10. Agregar test o control para evitar regresion.

---

## Regla De Cierre

Ningun incidente se considera cerrado sin:

- causa raiz documentada;
- impacto estimado;
- acciones correctivas;
- evidencia de verificacion;
- decision sobre comunicacion externa;
- follow-ups asignados.
