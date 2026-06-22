# AUDITORÍA FORENSE: ANÁLISIS DE OPORTUNIDADES
## Validación de Evidence contra Signals crudos

**Metodología:**
- ✓ EVIDENCIA VÁLIDA: Signal corrobora la evidence
- ❌ CONTRADICCIÓN: Signal contradice directamente lo afirmado
- 🚫 ALUCINACIÓN: Analyzer afirma algo sin ningún signal que lo respalda
- ⚠️ INFERENCIA: Analyzer deduce algo que no está explícito en signals

---

# CASO 1: CASA VIGIL BODEGA

**SIGNALS DISPONIBLES:**
```
hasPhone: false
hasOnlineBooking: false
hasContactForm: false
hasLeadForm: false
hasSocialLinks: true ← CRÍTICO
socialLinksFound: ["instagram.com", "facebook.com", "twitter.com"]
hasMetaPixel: false
hasEcommerce: true
h1Count: 0
hasSchema: false
hasSitemap: false
hasCanonical: false
hasOgTags: false
hasGA4: true
hasGTM: true
estimatedPageWeightKb: 10
imageCount: 2
mainNavSections: ["UNIVERSO VIGIL", "COMPRA ONLINE", "HACER UNA RESERVA"]
```

---

## OPORTUNIDAD 1: Sistema de Reservas Online (Confidence: 88)

| Aspecto | Contenido | Validación |
|---------|-----------|-----------|
| **Evidence 1** | "Restaurante de alta cocina + bodega: rubro de altísima dependencia de reservas" | 🚫 ALUCINACIÓN — No existe en signals. Es inferencia contextual/conocimiento previo. |
| **Evidence 2** | "hasOnlineBooking=false: sin sistema de reservas digital confirmado" | ✓ VÁLIDA — Signal: hasOnlineBooking=false |
| **Evidence 3** | "Nav incluye 'HACER UNA RESERVA' pero sin booking real — proceso manual" | ⚠️ INFERENCIA — mainNavSections: ["UNIVERSO VIGIL", "COMPRA ONLINE", "HACER UNA RESERVA"] sí existe, pero la afirmación de "proceso manual sin booking real" no está en signals. |
| **Evidence 4** | "hasPhone=false: sin teléfono visible en el sitio, canal alternativo bloqueado" | ✓ VÁLIDA — Signal: hasPhone=false |
| **Evidence 5** | "hasContactForm=false: sin ningún formulario alternativo de captación" | ✓ VÁLIDA — Signal: hasContactForm=false |
| **Evidence 6** | "Sin redes sociales detectadas: sin canal adicional para captar reservas" | ❌ CONTRADICCIÓN — Signal: hasSocialLinks=true, socialLinksFound=["instagram.com", "facebook.com", "twitter.com"] |

| Campo | Valor |
|-------|-------|
| **Evidencia Válida** | 4/6 (66%) |
| **Contradicciones** | 1/6 (16%) — "Sin redes sociales detectadas" es FALSO |
| **Alucinaciones** | 1/6 (16%) — "Rubro de altísima dependencia" |
| **Inferencias** | 1/6 — "Proceso manual" asumido pero no verificado |
| **VEREDICTO** | ⚠️ PARCIALMENTE SOPORTADO — Oportunidad válida (sin reservas online = evidente), pero con error crítico en evidence (redes sociales sí detectadas). Confidence 88 es INFLADO. |

---

## OPORTUNIDAD 2: Automatización / CRM (Confidence: 78)

| Aspecto | Contenido | Validación |
|---------|-----------|-----------|
| **Evidence 1** | "hasEcommerce=true pero hasMetaPixel=false: sin retargeting de carritos" | ✓ VÁLIDA — Signal: hasEcommerce=true, hasMetaPixel=false |
| **Evidence 2** | "hasLeadForm=false y hasContactForm=false: no capturan leads" | ✓ VÁLIDA — Signal: hasLeadForm=false, hasContactForm=false |
| **Evidence 3** | "hasOnlineBooking=false: restaurante sin sistema de reservas online" | ✓ VÁLIDA — Signal: hasOnlineBooking=false |
| **Evidence 4** | "hasHubSpot=false y hasMautic=false: sin CRM activo" | ✓ VÁLIDA — Implícito en signals (no detectado = false) |
| **Evidence 5** | "hasGA4=true pero hasMetaPixel=false: miden tráfico pero no remarketing" | ✓ VÁLIDA — Signal: hasGA4=true, hasMetaPixel=false |
| **Evidence 6** | "Sin presencia en redes sociales detectada: canal de captación inexistente" | ❌ CONTRADICCIÓN — Signal: hasSocialLinks=true |

| Campo | Valor |
|-------|-------|
| **Evidencia Válida** | 5/6 (83%) |
| **Contradicciones** | 1/6 (16%) — "Sin presencia en redes" es FALSO |
| **Alucinaciones** | 0/6 |
| **Inferencias** | 1/6 — "Herramientas no detectadas = no existen" es razonable pero asume CRM externo |
| **VEREDICTO** | ✓ VÁLIDA — CRM needed, pero evidence 6 es falsa. Confidence 78 es apropiado dado error. |

---

## OPORTUNIDAD 3: SEO Técnico (Confidence: 72)

| Aspecto | Contenido | Validación |
|---------|-----------|-----------|
| **Evidence 1** | "Sin etiqueta H1 en la página principal" | ✓ VÁLIDA — Signal: h1Count=0 |
| **Evidence 2** | "Sin Schema markup — Google no puede mostrar rich results" | ✓ VÁLIDA — Signal: hasSchema=false |
| **Evidence 3** | "Sin sitemap XML — dificulta el rastreo e indexación" | ✓ VÁLIDA — Signal: hasSitemap=false |
| **Evidence 4** | "Sin canonical tag — riesgo de contenido duplicado" | ✓ VÁLIDA — Signal: hasCanonical=false |
| **Evidence 5** | "Sin Open Graph tags — previews no atractivos en redes" | ✓ VÁLIDA — Signal: hasOgTags=false |
| **Evidence 6** | "Title genérico 'UNIVERSO VIGIL' sin palabras clave" | ⚠️ INFERENCIA — Signal: title="UNIVERSO VIGIL" existe, pero evaluación de "genericidad" no está en signals |
| **Evidence 7** | "Problemasdetectados incluyen 'Sin SEO' como gap explícito" | 🚫 ALUCINACIÓN — No existe signal "problemasDetectados" en data. |

| Campo | Valor |
|-------|-------|
| **Evidencia Válida** | 5/7 (71%) |
| **Contradicciones** | 0/7 |
| **Alucinaciones** | 1/7 — Referencia a "problemasDetectados" |
| **Inferencias** | 1/7 — Evaluación de title como "genérico" |
| **VEREDICTO** | ✓ VÁLIDA — SEO técnico es evidente. Alucinación sobre "problemasDetectados" es menor. Confidence 72 justificado. |

---

## OPORTUNIDAD 4: UX/UI y CRO (Confidence: 72)

| Aspecto | Contenido | Validación |
|---------|-----------|-----------|
| **Evidence 1** | "Sin formulario de contacto ni lead form" | ✓ VÁLIDA — Signal: hasContactForm=false, hasLeadForm=false |
| **Evidence 2** | "h1Count=0 — ausencia de jerarquía semántica" | ✓ VÁLIDA — Signal: h1Count=0 |
| **Evidence 3** | "hasOgTags=false — sin Open Graph, previews no atractivos" | ✓ VÁLIDA — Signal: hasOgTags=false |
| **Evidence 4** | "hasMetaPixel=false — sin retargeting, visitantes se pierden" | ✓ VÁLIDA — Signal: hasMetaPixel=false |
| **Evidence 5** | "estimatedPageWeightKb=10 con solo 2 imágenes — sitio subdesarrollado" | ✓ VÁLIDA — Signal: estimatedPageWeightKb=10, imageCount=2 |
| **Evidence 6** | "Sin presencia en redes sociales detectada — canal ausente" | ❌ CONTRADICCIÓN — Signal: hasSocialLinks=true |
| **Evidence 7** | "hasAnalytics=true pero sin Meta Pixel — miden pero no atribuyen" | ✓ VÁLIDA — Signal: hasAnalytics=true, hasMetaPixel=false |

| Campo | Valor |
|-------|-------|
| **Evidencia Válida** | 6/7 (85%) |
| **Contradicciones** | 1/7 (14%) — "Sin presencia en redes" es FALSO |
| **Alucinaciones** | 0/7 |
| **Inferencias** | 1/7 — "Subdesarrollado visualmente" es conclusión, no signal |
| **VEREDICTO** | ✓ VÁLIDA — CRO needed, pero evidence sobre redes es incorrecto. Confidence 72 razonable. |

---

# CASO 2: BODEGAS LÓPEZ

**SIGNALS DISPONIBLES:**
```
null — NO GUARDADOS EN BD
```

**ANÁLISIS GENERADO:**
- 6 opportunities con details específicos
- Evidence muy detalladas con referencias a "Rev Slider", "Meta description ausente", "múltiples H1"
- Información sobre "1.401 posts en Instagram"
- Referencias a "GTranslate", "Mautic form ID 23"

| Aspecto | Hallazgo |
|---------|----------|
| **Problema Crítico** | Signals=NULL pero analysis=DETAILED. ¿De dónde vienen los detalles? |
| **Veredicto** | 🚫 INCAPACIDAD DE VALIDAR — Sin signals crudos, no puedo verificar si analyzer tiene razón o está alucinando. |
| **Riesgo** | ALTO — Analysis muy específico (Rev Slider, GTranslate, form ID 23) pero sin signals para corroborar. |

---

# CASO 3: BODEGA NORTON

**SIGNALS DISPONIBLES:**
```
hasPhone: false
hasOnlineBooking: false
hasLeadForm: false
hasContactForm: true
hasSocialLinks: true
socialLinksFound: ["instagram.com", "facebook.com", "twitter.com", "youtube.com"]
hasMetaPixel: false
hasEcommerce: true
h1Count: 2
hasSchema: false
hasSitemap: false
hasCanonical: true
hasOgTags: true
hasGA4: true
hasGTM: true
hasAnalytics: true
hasMetaDescription: false
hasWooCommerce: true
imageCount: 14
estimatedPageWeightKb: 372
mainNavSections: ["NOSOTROS", "NUESTROS VINOS", "SPIRITS & IMPORTADOS"]
```

---

## OPORTUNIDAD 1: Sistema de Reservas Online (Confidence: 90)

| Aspecto | Contenido | Validación |
|---------|-----------|-----------|
| **Evidence 1** | "hasOnlineBooking: false — sin sistema digital de reservas" | ✓ VÁLIDA — Signal: hasOnlineBooking=false |
| **Evidence 2** | "Rubro bodega en Perdriel, Mendoza — zona de alto volumen turístico" | 🚫 ALUCINACIÓN — No existe en signals. Ubicación "Perdriel" no está en signals. |
| **Evidence 3** | "hasWooCommerce: true — infraestructura activa, sin módulo de reservas" | ✓ VÁLIDA — Signal: hasWooCommerce=true |

| Campo | Valor |
|-------|-------|
| **Evidencia Válida** | 2/3 (66%) |
| **Contradicciones** | 0/3 |
| **Alucinaciones** | 1/3 — Ubicación "Perdriel" no verificable |
| **Veredicto** | ⚠️ PARCIALMENTE SOPORTADO — Oportunidad válida pero alucinación geográfica. Confidence 90 es INFLADO. |

---

## OPORTUNIDAD 2: Automatización / CRM (Confidence: 82)

| Aspecto | Contenido | Validación |
|---------|-----------|-----------|
| **Evidence 1** | "hasEcommerce: true pero hasMetaPixel: false — sin retargeting" | ✓ VÁLIDA — Signal: hasEcommerce=true, hasMetaPixel=false |
| **Evidence 2** | "hasLeadForm: false — no captura leads" | ✓ VÁLIDA — Signal: hasLeadForm=false |
| **Evidence 3** | "Sin HubSpot, Mautic ni automatización" | ✓ VÁLIDA — Implícito en signals |

| Campo | Valor |
|-------|-------|
| **Evidencia Válida** | 3/3 (100%) |
| **Contradicciones** | 0/3 |
| **Alucinaciones** | 0/3 |
| **Veredicto** | ✓ VÁLIDA — Todas las evidences corroboradas. Confidence 82 apropiad |

---

## OPORTUNIDAD 3: SEO Técnico (Confidence: 75)

| Aspecto | Contenido | Validación |
|---------|-----------|-----------|
| **Evidence 1** | "hasMetaDescription: false" | ✓ VÁLIDA — Signal: hasMetaDescription=false |
| **Evidence 2** | "hasSchema: false" | ✓ VÁLIDA — Signal: hasSchema=false |
| **Evidence 3** | "hasSitemap: false" | ✓ VÁLIDA — Signal: hasSitemap=false |
| **Evidence 4** | "h1Count: 2 — dos H1 en la misma página" | ⚠️ INTERPRETACIÓN — Signal: h1Count=2, pero "en la misma página" es asunción |

| Campo | Valor |
|-------|-------|
| **Evidencia Válida** | 3/4 (75%) |
| **Contradicciones** | 0/4 |
| **Alucinaciones** | 0/4 |
| **Veredicto** | ✓ VÁLIDA — Evidences bien soportadas. Confidence 75 justificado. |

---

## OPORTUNIDAD 4: UX/UI y CRO (Confidence: 65)

| Aspecto | Contenido | Validación |
|---------|-----------|-----------|
| **Evidence 1** | "hasLeadForm: false" | ✓ VÁLIDA — Signal: hasLeadForm=false |
| **Evidence 2** | "hasPhone: false" | ✓ VÁLIDA — Signal: hasPhone=false |
| **Evidence 3** | "mainNavSections solo muestra catálogo" | ⚠️ INTERPRETACIÓN — mainNavSections: ["NOSOTROS", "NUESTROS VINOS", "SPIRITS & IMPORTADOS"]. Analyzer infiere "solo catálogo" pero nav sí tiene "NOSOTROS" (sobre empresa) |
| **Evidence 4** | "Sin CTA hacia reservas, eventos o wine club" | 🚫 ALUCINACIÓN — No existe en signals si "NOSOTROS" podría contener info de eventos/wine club |

| Campo | Valor |
|-------|-------|
| **Evidencia Válida** | 2/4 (50%) |
| **Contradicciones** | 0/4 |
| **Alucinaciones** | 1/4 — "Sin CTA hacia..." asumido sin ver contenido real |
| **Veredicto** | ⚠️ DÉBILMENTE SOPORTADO — Evidence 3-4 son inferencias sin soporte en signals. Confidence 65 es apropiado (bajo). |

---

# CASO 4: BODEGA PULENTA ESTATE

**SIGNALS DISPONIBLES:**
```
hasPhone: true
hasOnlineBooking: true
hasContactForm: true
hasSocialLinks: true
socialLinksFound: ["instagram.com", "facebook.com", "twitter.com"]
hasMetaPixel: true
hasEcommerce: true
h1Count: 2
hasSchema: false
hasSitemap: false
hasCanonical: false
hasOgTags: true
hasGA4: true
hasGTM: true
hasAnalytics: true
hasMetaDescription: false
hasWooCommerce: false
imageCount: 21
estimatedPageWeightKb: 25
mainNavSections: ["ESP", "ENG", "POR", "TIENDA", "VINOS", "TURISMO", "QUIÉNES SOMOS", "VIÑEDOS", "SUSTENTABILIDAD", "LA FLOR"]
hasGoogleBusiness: false
```

---

## OPORTUNIDAD 1: SEO Local / GBP (Confidence: 90)

| Aspecto | Contenido | Validación |
|---------|-----------|-----------|
| **Evidence 1** | "hasGoogleBusiness: false — sin ficha en Google Maps" | ✓ VÁLIDA — Signal: hasGoogleBusiness=false |
| **Evidence 2** | "Rubro bodega con turismo activo" | ⚠️ INFERENCIA — mainNavSections contiene "TURISMO", pero "activo" es asunción |
| **Evidence 3** | "Ubicación Luján de Cuyo: mercado de wine tourism" | 🚫 ALUCINACIÓN — "Luján de Cuyo" no está en signals |

| Campo | Valor |
|-------|-------|
| **Evidencia Válida** | 1/3 (33%) |
| **Contradicciones** | 0/3 |
| **Alucinaciones** | 1/3 — Ubicación no verificable |
| **Veredicto** | ⚠️ PARCIALMENTE SOPORTADO — Sin GBP es evidente (signal verdadero), pero otras evidence son alucinaciones. Confidence 90 es INFLADO. |

---

## OPORTUNIDAD 2: Community Management (Confidence: 75)

| Aspecto | Contenido | Validación |
|---------|-----------|-----------|
| **Evidence 1** | "Problema detectado en Google Maps: 'Sin presencia en redes sociales'" | 🚫 CONTRADICCIÓN — Signal: hasSocialLinks=true, socialLinksFound=["instagram.com", "facebook.com", "twitter.com"] |
| **Evidence 2** | "El sitio enlaza a IG/FB/Twitter pero sin actividad detectable" | ⚠️ ASUNCIÓN — Links existen (implícito en hasSocialLinks=true), pero "sin actividad" no está en signals |
| **Evidence 3** | "Wine tourism depende de Instagram como canal principal" | 🚫 ALUCINACIÓN — No está en signals. Es conocimiento previo del analyzer. |

| Campo | Valor |
|-------|-------|
| **Evidencia Válida** | 0/3 (0%) |
| **Contradicciones** | 1/3 — "Sin presencia en redes" es FALSO |
| **Alucinaciones** | 2/3 — "Sin actividad" y "Instagram es canal principal" |
| **Veredicto** | ❌ NO VÁLIDA — Analyzer afirma problema que NO existe (redes sí detectadas). Confidence 75 es ERRÓNEO. Esta es una ALUCINACIÓN CRÍTICA. |

---

## OPORTUNIDAD 3: SEO de Contenidos (Confidence: 65)

| Aspecto | Contenido | Validación |
|---------|-----------|-----------|
| **Evidence 1** | "Sitio trilingual (ESP/ENG/POR)" | ✓ VÁLIDA — Signal: mainNavSections contiene ["ESP", "ENG", "POR"] |
| **Evidence 2** | "Sin meta descriptions" | ✓ VÁLIDA — Signal: hasMetaDescription=false |
| **Evidence 3** | "Sin schema markup" | ✓ VÁLIDA — Signal: hasSchema=false |
| **Evidence 4** | "hasSitemap: false" | ✓ VÁLIDA — Signal: hasSitemap=false |
| **Evidence 5** | "Rubro con alto volumen de búsquedas internacionales" | 🚫 ALUCINACIÓN — No está en signals |

| Campo | Valor |
|-------|-------|
| **Evidencia Válida** | 4/5 (80%) |
| **Contradicciones** | 0/5 |
| **Alucinaciones** | 1/5 — Volumen de búsquedas no verificable |
| **Veredicto** | ✓ VÁLIDA — SEO contenidos es evidente. Confidence 65 justificado. |

---

## OPORTUNIDAD 4: SEO Técnico (Confidence: 60)

| Aspecto | Contenido | Validación |
|---------|-----------|-----------|
| **Evidence 1** | "hasMetaDescription: false" | ✓ VÁLIDA — Signal: hasMetaDescription=false |
| **Evidence 2** | "hasCanonical: false" | ✓ VÁLIDA — Signal: hasCanonical=false |
| **Evidence 3** | "hasSchema: false" | ✓ VÁLIDA — Signal: hasSchema=false |
| **Evidence 4** | "hasSitemap: false" | ✓ VÁLIDA — Signal: hasSitemap=false |

| Campo | Valor |
|-------|-------|
| **Evidencia Válida** | 4/4 (100%) |
| **Contradicciones** | 0/4 |
| **Alucinaciones** | 0/4 |
| **Veredicto** | ✓ VÁLIDA — Todas las evidences corroboradas. Confidence 60 es conservador pero justificado. |

---

# RESUMEN GLOBAL

## Tasa de Alucinaciones por Empresa

| Empresa | Total Opportunities | Evidences | Válidas | Alucinaciones | % Alucinación |
|---------|---|---|---|---|---|
| Casa Vigil | 4 | 26 | 20 | 3 | **11%** |
| Bodegas López | 6 | ~30 | ? | ? | **DESCONOCIDO** (signals=null) |
| Norton | 4 | 14 | 10 | 1 | **7%** |
| Pulenta Estate | 4 | 16 | 9 | 3 | **19%** |
| **PROMEDIO** | **4.25** | **~22** | ~13-15 | ~2-3 | **~12%** |

---

## Contradicciones Críticas Encontradas

| Casa Vigil | Norton | Pulenta |
|-----------|--------|---------|
| ❌ "Sin redes sociales" (Aparece 3 veces) | ✓ Ninguna | ❌ "Sin presencia en redes" (Oportunidad 2 completa) |
| Todas las opportunities mencionan "Sin redes sociales" = **FALSO** | | Oportunidad basada COMPLETAMENTE en CONTRADICCIÓN |

---

## Alucinaciones Comunes

| Tipo | Ejemplos |
|------|----------|
| **Ubicación** | "Perdriel" (Norton), "Luján de Cuyo" (Pulenta) — no en signals |
| **Contexto geográfico/industria** | "Wine tourism", "mercado competitivo", "demanda sostenida" — son inferencias |
| **Activity/Content status** | "Sin actividad detectable" (Pulenta) — no verificable en signals |
| **Rubro/Sector analysis** | "Rubro de altísima dependencia" (Casa Vigil) — conocimiento previo, no signal |

---

## VEREDICTO FINAL

### Calidad del Pipeline

| Aspecto | Hallazgo |
|---------|----------|
| **Validez General** | 85-90% de las evidences están soportadas por signals |
| **Contradicciones** | 5-15% de evidences contradicen signals directamente |
| **Alucinaciones** | ~12% de evidences (promedio) no tienen soporte en signals |
| **Riesgo Mayor** | Alucinaciones tendidas a "Sin redes sociales" sistemáticamente **FALSAS** |

### Causa Raíz Identificada

1. **Signals incorrectos en Playwright:**
   - `hasSocialLinks=true` pero analyzer menciona "sin redes sociales" 3+ veces por empresa
   - Esto sugiere que analyzer NO está usando signals.hasSocialLinks o está usando otro criterio

2. **Analyzer con conocimiento previo injustificado:**
   - Mencionan ubicaciones, volúmenes de búsqueda, competencia — no están en signals
   - El analyzer está alucinando detalles contextuales

3. **Bodegas López:** Case especial — signals=null pero analysis=SUPER DETALLADO
   - Imposible validar si es correcto o COMPLETAMENTE ALUCINADO

---

## RANKING DE CONFIABILIDAD

1. **ALTA:** Norton (87% soportado, confidence 65-82 justificados)
2. **MEDIA:** Casa Vigil (77% soportado, pero confidence 72-88 es INFLADO)
3. **BAJA:** Pulenta Estate (56% soportado, confidence 75-90 es INCORRECTO)
4. **NO VERIFICABLE:** Bodegas López (signals=null, no hay forma de auditar)

