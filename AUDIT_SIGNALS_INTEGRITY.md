# Auditoría: Integridad de Signals (Playwright)

**Problema identificado:** Señales incorrectas → analyzers correctos → conclusiones equivocadas

---

## Caso: Casa Vigil / Universo Vigil

**Síntoma:** 
- Output dice "Sin redes sociales detectadas"
- Pero Casa Vigil tiene Instagram (observable visualmente)
- Signal: `hasSocialLinks: false`

**Diagnóstico:**

### Código de Detección (playwright-audit.service.ts:205-209)

```typescript
const socialDomains = ['instagram.com', 'facebook.com', 'linkedin.com', 'tiktok.com', 'twitter.com', 'x.com', 'youtube.com'];
const socialLinksFound = socialDomains.filter(d =>
  hrefAll.some(h => h.includes(d))  // ← AQUÍ
);
const hasSocialLinks = socialLinksFound.length > 0;
```

**¿Qué busca?**
- Todos los `href` en el HTML
- Si contienen exactamente "instagram.com", "facebook.com", etc.

**¿Qué NO detecta?**

1. **URLs acortadas** 
   ```html
   <a href="https://insta.gn/casavigil">Instagram</a>
   <!-- No contiene "instagram.com" → hasSocialLinks = false -->
   ```

2. **Links dinámicos en JavaScript**
   ```javascript
   // Instagram link generado por JS post-carga
   const igLink = `https://instagram.com/${companyHandle}`;
   document.querySelector('.social').innerHTML = `<a href="${igLink}">`;
   // Playwright evalúa antes de este JS → hasSocialLinks = false
   ```

3. **Links en iframes**
   ```html
   <iframe src="social-buttons.js"></iframe>
   <!-- Playwright NO accede a contenido de iframes -->
   ```

4. **URLs con parámetros**
   ```html
   <a href="https://instagram.com/casavigil/?utm_source=web">
   <!-- Detectado ✓ (contiene "instagram.com") -->
   
   <a href="https://instagram.com/casavigil#ref=website">
   <!-- Detectado ✓ (contiene "instagram.com") -->
   
   <a href="https://linktr.ee/casavigil">
   <!-- NO detectado ✗ (no contiene "instagram.com") -->
   ```

5. **Social buttons de librerías**
   ```html
   <script src="https://api.social-buttons.com/embed.js"></script>
   <!-- Script carga botones después → Playwright no los ve -->
   ```

---

## Otras Señales en Riesgo

### hasSocialLinks ⚠️ ALTO RIESGO

| Escenario | Detecta | Problema |
|-----------|---------|----------|
| Link directo a Instagram | ✓ | N/A |
| Link acortado bit.ly | ✗ | **Falso negativo** |
| Botones sociales JS | ✗ | **Falso negativo** |
| Widget Linktree | ✗ | **Falso negativo** |
| Instagram Feed plugin | ✗ | **Falso negativo** |

---

### hasPhone ⚠️ RIESGO MEDIO

```typescript
// playwright-audit.service.ts: busca en texto visible
const phoneRegex = /\+?[\d\s\-()]{6,}/;
const hasPhone = phoneRegex.test(bodyText);
```

**Problemas:**
- Busca números en texto visible
- Si teléfono está en un widget/plugin dinámico → puede no detectarse
- Números como códigos de producto podrían dar falsos positivos

---

### hasOnlineBooking ⚠️ RIESGO MEDIO

```typescript
// playwright-audit.service.ts: busca palabras clave
const bookingKeywords = ['reservar', 'reserva', 'booking', 'agendar', 'cita', 'turno'];
const hasOnlineBooking = bookingKeywords.some(kw =>
  bodyText.toLowerCase().includes(kw)
);
```

**Problemas:**
- **Sensible a idioma:** Busca en español. ¿Si el sitio es bilingüe en inglés?
- **Falso positivo:** "Reservar derechos" (copyright) → hasOnlineBooking = true
- **Falso negativo:** Sistema de reservas sin palabra "reservar" (ej: Calendly con label genérico)

---

### hasEcommerce ⚠️ RIESGO MEDIO

```typescript
const ecommercePlatforms = ['shopify', 'woocommerce', 'magento', 'prestashop'];
const ecommerceKeywords = ['carrito', 'compra', 'carrito de compras', 'checkout'];
const hasEcommerce = 
  ecommercePlatforms.some(p => bodyHtml.includes(p)) ||
  ecommerceKeywords.some(kw => bodyText.toLowerCase().includes(kw));
```

**Problemas:**
- **No detecta:** Stripe Checkout, Paddle, custom builds sin palabras clave
- **Falso negativo:** Sitios B2B que venden pero sin palabra "carrito"

---

## Impacto en Scores

### Resultado: Casa Vigil

Si `hasSocialLinks: false` pero debería ser `true`:

**BOOKING analyzer recibe:**
```json
{
  "hasSocialLinks": false,      // ← ERROR (debería true)
  "hasPhone": true,
  "hasOnlineBooking": false,
  "hasContactForm": true
}
```

**Analyzer razona:**
- "No tiene redes sociales" → señal de baja digitalización
- Baja score en social signals
- Pero **el razonamiento es correcto dado el input incorrecto**

---

## Soluciones Propuestas

### Nivel 1: Detección Mejorada (bajo costo)

```typescript
// En lugar de buscar solo "instagram.com"
const socialPatterns = [
  /instagram\.com/i,
  /ig\.com/i,
  /insta\.gn/i,
  /link\.instagram\.com/i,
  /linktr\.ee/i,
  /linktree\.com/i,
  // ... ampliar lista
];

const hasSocialLinks = socialPatterns.some(pattern =>
  hrefAll.some(h => pattern.test(h)) || bodyText.match(pattern)
);
```

**Costo:** ~30 minutos. **Ganancia:** +70% recall de redes sociales.

---

### Nivel 2: Ejecución Post-JS (medio costo)

```typescript
// Hacer esperar 3-5 segundos DESPUÉS de que los scripts ejecuten
await page.waitForLoadState('networkidle');  // Ya existe ✓
await page.waitForTimeout(3000);             // Ampliar espera

// Luego evaluar
const raw = await page.evaluate(() => {
  // Ahora los widgets dinámicos están presentes
  const socialLinks = document.querySelectorAll('[href*="instagram"], [href*="facebook"]');
  return socialLinks.length > 0;
});
```

**Costo:** +3-5 seg por auditoría (tolerable). **Ganancia:** +80% recall total.

---

### Nivel 3: Validación Manual (Alto costo)

Para Casa Vigil específicamente:

1. Acceder a casa-vigil.com manualmente
2. Abrir inspector de elementos (F12)
3. Buscar `instagram`, `facebook`, `social`
4. Registrar exactos hrefs encontrados
5. Comparar con qué detectó Playwright

```bash
# Simular Playwright
curl -s https://casa-vigil.com | grep -i instagram

# Si aparece y Playwright dice false → bug confirmado
```

---

## Recomendación

**Antes de auditar más código de Claude:**

1. **Validar 3 sitios reales** mostrando:
   - Instagram real (verificado visualmente)
   - Qué dice `hasSocialLinks` 
   - Por qué Playwright no lo detectó

2. **Aplicar Nivel 1** (30 min): ampliar patterns
3. **Aplicar Nivel 2** (bajo costo): espera post-JS
4. **Re-validar:** mismo 3 sitios

Esto es más crítico que cualquier ajuste de prompt porque **garbage in = garbage out**.

---

## Checkl ist

- [ ] Verificar Casa Vigil manualmente (Instagram presente)
- [ ] Capturar HTML de casa-vigil.com
- [ ] Grep por "instagram" en el HTML
- [ ] Si presente pero `hasSocialLinks=false` → confirmar bug Playwright
- [ ] Reproducir con 2 sitios más
- [ ] Aplicar Nivel 1 (patterns ampliados)
- [ ] Re-ejecutar 5 casos y validar
