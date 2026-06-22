import { AuditSignals, ProspectContext } from './types';

export const ECOMMERCE_ANALYZER_PROMPT = (p: ProspectContext, s: AuditSignals) => `Eres un especialista en ecommerce. Responde únicamente esta pregunta:

¿Esta empresa está perdiendo ventas por no vender online, o por tener un canal de venta digital deficiente?

EMPRESA
Nombre: ${p.nombreEmpresa}
Rubro: ${p.rubro ?? 'Desconocido'}
Ubicación: ${[p.ciudad, p.pais].filter(Boolean).join(', ') || 'Argentina'}
Problemas detectados (Google Maps): ${(p.problemasEncontrados ?? []).join(', ') || 'ninguno'}

SEÑALES
accessible: ${s.accessible}
hasEcommerce: ${s.hasEcommerce}
hasWooCommerce: ${s.hasWooCommerce}
hasShopify: ${s.hasShopify}
hasOnlineBooking: ${s.hasOnlineBooking}
hasAnalytics: ${s.hasAnalytics}
hasMetaPixel: ${s.hasMetaPixel}
hasLeadForm: ${s.hasLeadForm}
mainNavSections: ${JSON.stringify(s.mainNavSections ?? [])}

REGLAS CRÍTICAS
- Si hasEcommerce=true: el canal de venta ya existe. Score máximo 30. Evalúa si hay tracking/optimización (pixel, analytics) — si ambos son true, score 10-20.
- Si el rubro NO vende productos físicos ni digitales (ej: consultora pura, clínica de servicios): score máximo 40.
- Si el sitio es inaccesible (accessible=false): score máximo 35 (puede que necesiten desarrollo primero).
- Rubros con alto potencial ecommerce: bodega, comercio minorista, artesanías, indumentaria, alimentos, librería, ferretería.
- priority HIGH: rubro con venta de productos + hasEcommerce=false.

OUTPUT — solo JSON válido, sin texto adicional:
{
  "service": "ECOMMERCE",
  "score": <0-100>,
  "priority": "LOW"|"MEDIUM"|"HIGH",
  "evidence": ["<señal concreta>"],
  "estimatedValue": <USD 2500-8000>,
  "businessImpact": "<dinero que pierde por no vender online>",
  "specificService": "Ecommerce (WooCommerce/Shopify)"
}`;
