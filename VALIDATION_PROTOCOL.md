# PROTOCOLO DE VALIDACIÓN EMPÍRICA
## Fases 2-5 de la Auditoría de Degradación

---

## OBJETIVO

Confirmar hypotheses de causas raíz mediante análisis de datos reales.

**Duración estimada:** 2-3 horas  
**Requisitos:**
- Acceso a los 4 sitios reales
- Terminal + curl o Postman
- Editor de texto
- Navegador con DevTools

---

## FASE 2 — VALIDACIÓN DE SIGNALS

### Paso 1: Capturar signals.json de Casa Vigil

Supuesto: El API está corriendo en `http://localhost:5000`

```bash
# 1. Autenticar y obtener token
TOKEN=$(curl -s -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}' | jq -r '.access_token')

# 2. Enviar auditoría de sitio web
SIGNALS=$(curl -s -X POST http://localhost:5000/enrichment/audit-website \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://casa-vigil.com"}')

# 3. Guardar respuesta
echo "$SIGNALS" | jq '.' > casa_vigil_signals.json
```

### Paso 2: Inspeccionar manualmente Casa Vigil

Abrir https://casa-vigil.com en navegador:

```bash
# Buscar Instagram
# F12 → Console → Ctrl+F "instagram" en HTML

# Capturar HTML crudo para análisis
curl -s https://casa-vigil.com | grep -i "instagram" | head -20
```

### Paso 3: Completar matriz de validación

**Matriz para Casa Vigil:**

```markdown
| Signal | Valor Reportado | Encontrado Manualmente | Status | Evidencia |
|--------|---|---|---|---|
| hasSocialLinks | ? | ? | [ ] CORRECTO [ ] ERROR | URL: __________ |
| hasPhone | ? | ? | [ ] CORRECTO [ ] ERROR | Número: ________ |
| hasOnlineBooking | ? | ? | [ ] CORRECTO [ ] ERROR | Keyword: _______ |
| hasEcommerce | ? | ? | [ ] CORRECTO [ ] ERROR | Plataforma: ___ |
| hasContactForm | ? | ? | [ ] CORRECTO [ ] ERROR | Form id: ______ |
```

### Paso 4: Repetir para Bodegas López, Norton, Pulenta Estate

Misma matriz para cada sitio.

---

## FASE 3 — TRAZABILIDAD DE ANALYZERS

### Paso 1: Ejecutar pipeline completo de análisis

```bash
TOKEN=<jwt_token>

# Enviar prospecto para análisis
ANALYSIS=$(curl -s -X POST http://localhost:5000/enrichment/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombreEmpresa": "Casa Vigil",
    "rubro": "Hospedaje / Turismo",
    "ciudad": "Mendoza",
    "pais": "Argentina",
    "website": "casa-vigil.com",
    "problemasEncontrados": []
  }')

echo "$ANALYSIS" | jq '.' > casa_vigil_analysis.json
```

### Paso 2: Extraer scores de cada analyzer

```bash
jq '.opportunities[] | {service, confidence, impact, businessImpact}' casa_vigil_analysis.json
```

**Esperado:**
```json
[
  {
    "service": "BOOKING",
    "confidence": 88,
    "impact": "HIGH"
  },
  ...
]
```

### Paso 3: Documentar trazabilidad

Para cada analyzer (BOOKING, CRM, SEO, ECOMMERCE, CRO, WEB):

**Template:**

```markdown
## ANALYZER: BOOKING
Score: 88
Priority: HIGH

### Signals utilizadas
- hasSocialLinks: false
- hasOnlineBooking: false
- hasContactForm: true
- hasPhone: false

### Análisis de confiabilidad
- hasSocialLinks: ¿Correcto? [ ] Sí [ ] No (probablemente incorrecto - Linktree?)
- hasPhone: ¿Correcto? [ ] Sí [ ] No (probablemente incorrecto - widget dinámico?)

### Impacto en score
- Si hasSocialLinks fuera VERDAD: Score sería ___
- Si hasPhone fuera VERDAD: Score sería ___

### Verdict
Score de 88 se mantendría? [ ] Sí [ ] No
Cambiaría a: ___
```

---

## FASE 4 — AUDITORÍA DE ALUCINACIONES

### Paso 1: Extraer reasoning de cada analyzer

```bash
# Extraer solo el reasoning/businessImpact
jq '.opportunities[].businessImpact' casa_vigil_analysis.json
```

### Paso 2: Validar afirmaciones contra signals

Para cada afirmación, preguntar:

| Afirmación | Señal que la soporta | ¿Señal confiable? | Verdict |
|---|---|---|---|
| "Sin redes sociales" | hasSocialLinks=false | No (Playwright bug) | ALUCINACIÓN SECUNDARIA |
| "Sin teléfono" | hasPhone=false | No (widget dinámico) | ALUCINACIÓN SECUNDARIA |
| "Sin reservas online" | hasOnlineBooking=false | Quizás | DUDOSO |

### Paso 3: Clasificar alucinaciones

```markdown
## ALUCINACIONES DETECTADAS EN CASA VIGIL

### ALUCINACIÓN REAL (Signal verdad, analyzer miente)
- Ninguna detectada

### ALUCINACIÓN SECUNDARIA (Signal falsa, analyzer repite)
1. "Sin redes sociales detectadas"
   - Señal: hasSocialLinks=false
   - Realidad: Tiene Instagram (Linktree o link acortado)
   - Causa: Playwright no detecta links no directos
   
2. "Sin teléfono visible"
   - Señal: hasPhone=false
   - Realidad: Probablemente en widget dinámico
   - Causa: Playwright no captura widgets JS

### SIN EVIDENCIA (Signal falsa, analyzer incierto)
- Ninguna detectada

## SUMMARY
- Total alucinaciones: 2
- Causadas por Playwright: 2
- Causadas por analyzer logic: 0
```

---

## FASE 5 — ANÁLISIS DE RANKER

### Paso 1: Capturar todos los 6 scores

```bash
# Extraer scores raw de los 6 analyzers (antes de rankear)
jq '.opportunities[] | {service, confidence}' casa_vigil_analysis.json | sort -k3 -rn
```

**Esperado:**
```
Booking: 88
CRM: 75
SEO: 65
Ecommerce: 42
CRO: 50
Web: 35
```

### Paso 2: Verificar lógica del ranker

Ranker hace:
1. Filtra score >= 40 ✓
2. Ordena descendente ✓
3. Toma top 4 ✓

**Verificación:**
```bash
# ¿Los 4 primeros son realmente los más altos?
scored_services="Booking:88, CRM:75, SEO:65, Ecommerce:42, CRO:50, Web:35"
# Esperado: Booking, CRM, CRO, SEO (en ese orden)
# Actual: [ver output de opportunities]

# ¿Matchean? [ ] Sí [ ] No
```

### Paso 3: Identificar sesgo

**Preguntas:**
- ¿El ranker favorece ciertos servicios? No (ordena por score)
- ¿El ranker tiene configuración hardcodeada? No (código es neutral)
- ¿El problema está en el ranker? No, está upstream

**Conclusion:**
```markdown
Ranker: ✓ SIN SESGOS
Problema: ↑ En signals y analyzers
```

---

## RECOLECCIÓN DE DATOS

### Template de reporte por sitio

```markdown
# VALIDACIÓN: [NOMBRE SITIO]

## SIGNALS
| Signal | Reportado | Real | ¿Error? |
|--------|---|---|---|
| hasSocialLinks | ? | ? | [ ] |
| hasPhone | ? | ? | [ ] |
| hasOnlineBooking | ? | ? | [ ] |
| hasEcommerce | ? | ? | [ ] |

## ANALYZERS
| Analyzer | Score | Priority | Confiable? |
|---|---|---|---|
| BOOKING | ? | ? | [ ] |
| CRM | ? | ? | [ ] |
| SEO | ? | ? | [ ] |

## ALUCINACIONES
[ ] Ninguna detectada
[ ] 1-2 alucinaciones secundarias
[ ] 3+ alucinaciones (problema grave)

## CAUSA RAÍZ
[ ] Playwright (signals incorrectas)
[ ] Analyzers (logic incorrecta)
[ ] Ranker (sesgo)
[ ] Múltiples
```

---

## EJECUCIÓN PASO A PASO

### Hora 1: Casa Vigil

1. Capturar signals (5 min)
2. Validar manualmente (10 min)
3. Ejecutar análisis (5 min)
4. Documentar trazabilidad (20 min)
5. Auditar alucinaciones (10 min)
6. Analizar ranker (5 min)

**Total:** ~55 minutos

### Hora 2: Bodegas López + Norton + Pulenta Estate

Repetir protocolo para cada (20 min c/u) = 60 minutos

### Hora 3: Síntesis + reporte

- Compilar matriz global
- Identificar patrones
- Confirmar causa raíz
- Documentar recomendaciones

---

## SALIDA ESPERADA

Al finalizar, deberías tener:

1. **4 reportes detallados** (1 por sitio) con:
   - Signals correctas vs incorrectas
   - Alucinaciones catalogadas
   - Scores por analyzer
   - Causa raíz local

2. **Matriz comparativa:**
   ```
   | Sitio | Señales incorrectas | Alucinaciones | Causa raíz |
   |---|---|---|---|
   | Casa Vigil | 2-3 | 2 | Playwright |
   | Bodegas López | ? | ? | ? |
   | ...
   ```

3. **Diagnóstico final:**
   - % de problemas causados por Playwright
   - % causados por analyzers
   - % causados por ranker
   - Top 3 fixes por impacto

---

## NOTAS IMPORTANTES

- **No modificar código** — solo observar y documentar
- **Validar manualmente** — no confiar 100% en Playwright
- **Documentar todo** — screenshots, URLs, timestamps
- **Dudar siempre** — asumir que cualquier signal puede estar incorrecta

---

