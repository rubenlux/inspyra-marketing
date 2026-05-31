# SEC-004 — Backup & Disaster Recovery

**Estado:** Draft v1

---

## Objetivo

Definir el estandar de backups, restauracion y recuperacion ante desastre para el ecosistema Inspyra.

Esta spec extiende los requisitos de backups definidos en `SEC-001-security-baseline.md`.

---

## Alcance

Aplica a:

- PostgreSQL;
- storage de archivos;
- configuracion critica;
- secretos operativos;
- logs de auditoria;
- artefactos de deploy;
- datos de clientes;
- infraestructura HostingGuard e Inspyra Cloud.

---

## Requisitos Minimos

- Backups automaticos.
- Backups cifrados.
- Retencion definida por ambiente.
- Copia fuera del servidor.
- Restauracion probada periodicamente.
- Evidencia de restore.
- Alertas por fallo de backup.
- Procedimiento de rollback.
- RPO y RTO definidos antes de produccion.

---

## Objetivos Iniciales

| Sistema | RPO inicial | RTO inicial |
|---|---:|---:|
| ERP produccion | 24h | 4h |
| Billing | 12h | 4h |
| Auth | 12h | 4h |
| HostingGuard | 24h | 6h |
| Logs auditoria | 24h | 24h |

---

## Regla De Release

Ningun sistema critico pasa a produccion sin backup automatizado y restore probado al menos una vez.
