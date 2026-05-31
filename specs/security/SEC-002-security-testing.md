# SEC-002 — Security Testing & Verification Standard

# Nombre

SEC-002 — Security Testing & Verification

# Estado

Draft v1

---

# Objetivo

Definir la estrategia obligatoria de testing y validación de seguridad para todo el ecosistema Inspyra.

Aplica a:

* Inspyra ERP
* HostingGuard
* Inspyra Cloud
* Inspyra Mail
* Email Marketing
* MCP servers
* APIs internas
* Frontend
* Backend
* Infraestructura
* Docker
* CI/CD

---

# Principio rector

## Todo control de seguridad debe poder verificarse.

No alcanza con implementar seguridad.

Debe existir evidencia automatizada o manual verificable de que funciona.

---

# Tipos de testing obligatorios

---

## 1. Unit Security Tests

Validan lógica puntual aislada.

Cobertura mínima:

---

password hashing

---

JWT signing

---

JWT expiration

---

JWT invalid token rejection

---

refresh token rotation

---

permissions helpers

---

tenant ownership validation

---

input validation

---

sanitizers

---

HTML sanitization

---

Markdown sanitization

---

URL validation

---

MIME validation

---

file extension validation

---

upload validation

---

rate limit helper logic

---

anti-abuse guards

---

anti-enumeration responses

---

---

Ejemplo:

```ts
shouldRejectExpiredToken()

shouldRejectForeignTenantAccess()

shouldRejectExecutableUpload()

shouldSanitizeUnsafeHtml()

shouldValidateOwnershipBeforeDelete()
```

---

# 2. Integration Security Tests

Validan interacción entre servicios.

---

API + DB

---

API + Redis

---

API + Auth

---

API + Filesystem

---

API + Billing

---

API + Tenant Isolation

---

Ejemplos:

---

usuario tenant A no puede acceder tenant B

---

refresh token invalidado luego de logout

---

password reset token expira correctamente

---

usuario suspendido no puede autenticarse

---

billing API rechaza access no autorizado

---

# 3. API Security Tests

Testear endpoints reales.

Cada endpoint debe validar:

---

401 Unauthorized

---

403 Forbidden

---

404 seguro

---

429 Rate Limited

---

payload inválido

---

Content-Type inválido

---

Origin inválido

---

token inválido

---

token expirado

---

resource ownership inválido

---

tenant mismatch

---

IDOR attempts

---

BOLA attempts

---

mass assignment attempts

---

JSON malformed body

---

oversized payload

---

invalid HTTP methods

---

Ejemplo:

```http
POST /api/clientes
GET /api/proyectos/:id
DELETE /api/invoices/:id
PATCH /api/team/:id
```

Todos deben probar happy path + attack path.

---

# 4. Authentication Security Tests

Cobertura mínima:

---

login válido

---

login inválido

---

brute force lock temporal

---

password reset flow

---

expired reset token

---

reused reset token

---

refresh token reuse detection

---

logout invalidation

---

session expiration

---

session revocation

---

password change invalidates old sessions

---

email verification flow

---

change email confirmation flow

---

MFA success

---

MFA invalid code

---

# 5. Authorization Tests

Cobertura mínima:

---

admin access

---

staff access

---

client portal access

---

readonly access

---

restricted module access

---

cross-role forbidden access

---

tenant isolation access control

---

ownership before update

---

ownership before delete

---

ownership before export

---

ownership before restore

---

# 6. Upload Security Tests

Validar:

---

archivo válido permitido

---

MIME falso rechazado

---

doble extensión rechazada

---

.exe rechazado

---

.php rechazado

---

.sh rechazado

---

.zip bomb detection

---

path traversal rejection

---

null byte injection rejection

---

oversized upload rejection

---

invalid image rejection

---

# 7. Frontend Security Tests

Validar:

---

no secrets exposed in build

---

no API keys in client bundle

---

no sensitive console logs

---

XSS rendering prevention

---

HTML escaping correcto

---

markdown sanitization correcto

---

external links seguros

---

noopener noreferrer aplicado

---

CSP compatible con frontend

---

# 8. Infrastructure Security Tests

Validar:

---

HTTPS responde correctamente

---

HTTP redirige a HTTPS

---

TLS correcto

---

certificado válido

---

headers HTTP presentes

---

DB no expuesta públicamente

---

Redis no expuesto públicamente

---

puertos internos cerrados

---

firewall correcto

---

SSH root disabled

---

Docker no root

---

container capabilities limitadas

---

filesystem readonly cuando aplica

---

# 9. Dependency Security Scanning

Ejecutar automáticamente:

---

npm audit

---

pnpm audit

---

pip-audit

---

Trivy

---

Docker Scout

---

Snyk si aplica

---

Dependabot alerts

---

Renovate validation

---

# 10. DAST — Dynamic Security Testing

Escaneo automático staging:

---

OWASP ZAP

---

Nikto opcional

---

header validation scanners

---

TLS scanners

---

CSP validation tools

---

cookie security validators

---

---

Debe correr antes del deploy productivo.

---

# 11. SAST — Static Security Testing

Escaneo obligatorio sobre código fuente:

---

Semgrep

---

ESLint security rules

---

Bandit (Python)

---

CodeQL opcional

---

secret scanning CI

---

grep de credenciales expuestas

---

detección de:

hardcoded secrets

eval()

unsafe HTML rendering

raw SQL

insecure file access

command injection risks

---

# 12. Regression Security Testing

Cada bug de seguridad corregido debe dejar:

---

test reproducible

---

fix

---

test passing post-fix

---

No se cierra incidente sin test asociado.

---

# 13. Pentest Checklist Manual

Antes de releases mayores ejecutar revisión manual:

---

Broken access control

---

IDOR

---

BOLA

---

JWT abuse

---

session hijacking

---

CSRF

---

XSS

---

Stored XSS

---

Reflected XSS

---

file upload abuse

---

path traversal

---

SSRF

---

open redirect

---

mass assignment

---

tenant escape

---

rate limit bypass

---

billing abuse

---

email abuse

---

automation abuse

---

prompt injection contra agentes IA

---

MCP abuse attempts

---

# 14. Security CI Gate

Pipeline bloquea deploy si falla:

---

tests unitarios seguridad

---

tests integración seguridad

---

SAST

---

dependency scan crítico

---

secret leak detection

---

container vulnerability crítica

---

OWASP scan crítico

---

# Cobertura mínima requerida

## Backend

mínimo 90%

## Auth

mínimo 95%

## Billing

mínimo 95%

## Seguridad multi-tenant

100%

## Permisos

100%

## Inputs críticos

100%

---

# Política de release

No se aprueba producción si:

* falla test de auth
* falla test de permisos
* falla tenant isolation
* falla JWT validation
* falla upload validation
* aparece vulnerabilidad crítica abierta
* secret leak detectado
* DAST crítico abierto
* SAST crítico abierto

---

# Resultado esperado

Cada release de Inspyra debe ser:

---

funcionalmente estable

---

seguro técnicamente

---

auditado

---

testeado automáticamente

---

verificable

---

reproducible

---

con evidencia objetiva previa al deploy
