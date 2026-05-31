# SPEC — Seguridad Global del Sistema

# Nombre

SEC-001 — Security Baseline & Platform Security Standard

# Estado

Draft v1

---

# Objetivo

Definir el estándar de seguridad obligatorio para todo el ecosistema Inspyra:

* Inspyra ERP
* HostingGuard
* Inspyra Cloud
* Inspyra Mail
* Email Marketing
* MCP & AI Tool Gateway
* APIs internas
* Frontend
* Backend
* Infraestructura
* DevOps / CI/CD

Esta especificación funciona como:

# fuente única de verdad de seguridad del proyecto

Toda nueva feature, módulo, API, agente o integración debe cumplir esta spec antes de llegar a producción.

---

# Principio rector

## Security by Design

La seguridad no se agrega al final.

La seguridad forma parte del diseño inicial.

Toda implementación debe construirse considerando:

---

confidencialidad

---

integridad

---

disponibilidad

---

aislamiento

---

mínimo privilegio

---

trazabilidad

---

resiliencia

---

# Alcance

Aplica a:

---

frontend web

---

backend APIs

---

base de datos

---

Redis

---

Docker

---

workers

---

cron jobs

---

MCP servers

---

agentes IA

---

integraciones externas

---

uploads

---

auth

---

billing

---

clientes

---

usuarios internos

---

deployments

---

servidores

---

pipelines CI/CD

---

# 1. Arquitectura y diseño seguro

Requerimientos obligatorios:

---

HTTPS obligatorio en todo el proyecto

---

redirección automática HTTP → HTTPS

---

HSTS habilitado

---

TLS 1.2 mínimo

---

TLS 1.3 habilitado

---

certificados renovados automáticamente

---

prohibido certificados autofirmados en producción

---

separación frontend / backend

---

separación dev / staging / production

---

base de datos aislada de internet

---

Redis aislado de internet

---

no exponer puertos internos públicamente

---

arquitectura least privilege

---

zero trust entre servicios internos

---

deny-by-default networking

---

segmentación por redes Docker

---

separación servicios públicos vs privados

---

protección contra SSRF internos

---

reverse proxy delante del backend

---

mínimo fingerprinting de infraestructura

---

# 2. HTTP Security Headers

Aplicación obligatoria de:

---

Strict-Transport-Security

---

Content-Security-Policy

---

X-Frame-Options

---

X-Content-Type-Options

---

Referrer-Policy

---

Permissions-Policy

---

Cross-Origin-Opener-Policy

---

Cross-Origin-Embedder-Policy

---

Cross-Origin-Resource-Policy

---

Eliminar:

Server: nginx

Server: uvicorn

X-Powered-By

---

CSP estricta:

sin wildcards innecesarios

sin unsafe-eval

unsafe-inline reducido al mínimo posible

frame-ancestors estricta

base-uri 'self'

form-action 'self'

connect-src explícito

---

# 3. API Security

Toda API debe implementar:

---

CORS restringido por dominio exacto

---

prohibido `*`

---

validación estricta Origin

---

validación Content-Type

---

rate limit por IP

---

rate limit por usuario

---

rate limit por endpoint

---

rate limit por tenant

---

payload size validation

---

protección JSON bomb

---

rechazo métodos HTTP no permitidos

---

protección IDOR

---

protección BOLA

---

protección Broken Function Level Authorization

---

UUID v4 preferible

---

nunca confiar IDs enviados por frontend

---

validación ownership obligatoria

---

# 4. Validación de entrada

Todo input debe:

---

sanitizarse

---

validarse

---

normalizarse

---

escaparse correctamente

---

Validaciones mínimas:

---

email

---

URL

---

dominios

---

slugs

---

nombres archivo

---

MIME real

---

extensión real

---

longitud mínima

---

longitud máxima

---

JSON shape esperado

---

rechazo campos extra

---

rechazo objetos inesperados

---

rechazo arrays inesperados

---

normalización Unicode

---

sanitización HTML

---

sanitización Markdown

---

escape output HTML / JS / SQL

---

# 5. Seguridad Base de Datos

Obligatorio:

---

Prepared Statements

---

prohibido concatenación SQL

---

protección SQL injection

---

DB user no root

---

least privilege DB

---

rotación credenciales

---

password fuerte DB

---

backups cifrados

---

DB fuera de internet

---

firewall DB

---

replicación segura

---

auditoría queries críticas

---

connection timeout

---

pooling controlado

---

límite conexiones

---

cifrado en tránsito

---

cifrado en reposo cuando aplique

---

prohibido loggear queries sensibles

---

# 6. Autenticación

Aplicar:

---

Argon2 o bcrypt

---

nunca guardar passwords plano

---

MFA opcional o requerido según rol

---

password reset seguro

---

token reset expirado automáticamente

---

token reset single-use

---

access token corta duración

---

refresh token separado

---

rotación refresh token

---

logout invalida refresh token

---

cambio password invalida sesiones previas

---

verificación email

---

confirmación cambio email

---

re-auth para acciones sensibles

---

protección brute force

---

protección credential stuffing

---

protección account enumeration

---

no revelar si email existe o no

---

bloqueo temporal ante abuso

---

# 7. JWT y sesiones

Obligatorio:

---

JWT firmado fuerte

---

JWT secret largo aleatorio

---

rotación secrets

---

verificar:

exp

iat

aud

iss

sub

---

prohibido alg=none

---

refresh token revocable

---

session fixation protection

---

session regeneration post-login

---

idle timeout

---

absolute timeout

---

lista negra tokens revocados

---

cookies HttpOnly

---

cookies Secure

---

cookies SameSite=Lax

---

cookies no accesibles desde JS

---

# 8. Multi-Tenant Security

Preparado para futuro SaaS.

---

tenant isolation real

---

tenant_id obligatorio

---

ownership validation obligatoria

---

nunca cruzar datos entre tenants

---

filesystem separado por tenant

---

storage separado

---

cache separada

---

backups separados si aplica

---

límites recursos por tenant

---

# 9. Files & Upload Security

Aplicar:

---

validación MIME real

---

renombrado seguro

---

no ejecutar archivos subidos

---

uploads fuera del root público

---

URLs firmadas temporales cuando aplique

---

size limit

---

validación imágenes

---

protección ZIP bomb

---

protección path traversal

---

bloquear:

../

null byte injection

.php

.sh

.exe

.env

.git

---

# 10. Docker & Containers Security

Obligatorio:

---

no correr como root

---

usuario no privilegiado

---

read_only filesystem cuando sea posible

---

no-new-privileges

---

límite memoria

---

límite CPU

---

límite procesos

---

no montar docker.sock

---

no exponer .env dentro imagen

---

multi-stage builds

---

imágenes mínimas

---

update frecuente base image

---

Trivy scan

---

Docker Scout scan

---

no guardar secretos dentro imagen

---

# 11. Infraestructura Servidor

Aplicar:

---

SSH con keys only

---

desactivar login root

---

Fail2ban

---

UFW o nftables

---

solo 80/443 públicos

---

rotación logs

---

monitoring disco

---

monitoring RAM

---

monitoring CPU

---

alertas caídas

---

alertas reinicio

---

alertas 5xx

---

alertas uso anormal

---

watchdog servicios

---

auto-restart controlado

---

# 12. Secrets Management

Obligatorio:

---

nunca subir .env a Git

---

.gitignore correcto

---

secret scanning CI

---

rotación periódica secrets

---

secret store centralizado cuando escale

---

no loggear:

tokens

passwords

cookies

Authorization headers

---

prohibido API keys en frontend

---

# 13. Logging & Observability

Aplicar:

---

logs estructurados

---

Correlation ID

---

Request ID

---

no almacenar datos sensibles

---

logs auditoría

---

logs login

---

logs logout

---

logs password change

---

logs email change

---

logs billing

---

logs acciones destructivas

---

alertas seguridad

---

alertas brute force

---

alertas acceso sospechoso

---

alertas rate limit

---

alertas errores críticos

---

# 14. Frontend Security

Aplicar:

---

no exponer secrets en bundle

---

no sourcemaps públicos en producción

---

no console.log sensible

---

evitar JWT en localStorage si es posible

---

protección XSS DOM

---

sanitizar markdown renderizado

---

validar links externos

---

rel="noopener noreferrer"

---

no interpolar HTML crudo

---

protección clickjacking

---

evitar JS terceros innecesario

---

Subresource Integrity si aplica

---

revisión manual bundle JS

---

# 15. Backups & Recovery

Aplicar:

---

backups automáticos

---

backups versionados

---

backups cifrados

---

retención definida

---

restore probado

---

restore documentado

---

copia fuera del servidor

---

copia fuera del proveedor

---

rotación backups

---

verificación integridad periódica

---

# 16. DevSecOps

CI/CD obligatorio con:

---

branch protection

---

PR review obligatorio

---

secret scanning

---

dependency scanning

---

SAST

---

security linting

---

bloqueo merge si falla seguridad

---

Dependabot

---

Renovate

---

review periódica permisos GitHub

---

# 17. Seguridad lógica de negocio

Aplicar en ERP:

---

acciones destructivas requieren confirmación

---

doble confirmación para borrar recursos

---

audit trail obligatorio

---

billing protegido contra fraude

---

validación ownership antes de delete

---

validación ownership antes de update

---

validación ownership antes de export

---

validación ownership antes de restore

---

validación ownership antes acceso logs

---

# 18. Checklist obligatoria pre-deploy

Antes de producción verificar:

---

.env correcto

---

DEBUG=False

---

NODE_ENV=production

---

sin errores críticos en logs

---

certificados válidos

---

DB migrada correctamente

---

rollback preparado

---

backup previo realizado

---

smoke test OK

---

healthcheck OK

---

/metrics no público

---

/docs no público

---

/openapi.json no público

---

robots.txt correcto

---

sitemap.xml correcto

---

# Gate obligatorio de release

Ningún deployment a producción podrá aprobarse si falla alguno de los puntos críticos de esta spec.

---

# Objetivo estratégico

Poder garantizar que todo el ecosistema Inspyra opere bajo una base sólida de:

---

seguridad

---

aislamiento

---

privacidad

---

auditoría

---

resiliencia

---

trazabilidad

---

protección preventiva desde diseño
