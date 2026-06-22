import { Injectable, Logger } from '@nestjs/common';
import type { RawCompany } from '../providers/discovery-provider.interface';
import type { QualificationSignals } from './qualification-signals';

const FETCH_TIMEOUT_MS = 8_000;
const HTML_CAP        = 80_000; // 80 KB — suficiente para nav + footer donde viven los links sociales

@Injectable()
export class QualificationSignalsDetector {
  private readonly logger = new Logger(QualificationSignalsDetector.name);

  async detectSignals(company: RawCompany): Promise<QualificationSignals> {
    const base: QualificationSignals = {
      hasWebsite:     !!company.website,
      hasGBP:         !!company.googlePlaceId,
      hasInstagram:   company.instagram ? true : null,
      hasFacebook:    null,
      hasLinkedIn:    company.linkedin  ? true : null,
      hasWhatsapp:    null,
      hasEcommerce:   null,
      hasAgenda:      null,
      hasContactForm: null,
      sourceChecked:  'no_website',
    };

    if (!company.website) return base;

    const url = company.website.startsWith('http') ? company.website : `https://${company.website}`;
    const html = await this.fetchHtml(url);

    if (!html) {
      this.logger.debug(`[QS] ${company.nombreEmpresa}: fetch failed → señales null`);
      return base;
    }

    const signals: QualificationSignals = {
      ...base,
      sourceChecked:  'website',
      hasInstagram:   company.instagram ? true : this.detectInstagram(html),
      hasFacebook:    this.detectFacebook(html),
      hasLinkedIn:    company.linkedin  ? true : this.detectLinkedIn(html),
      hasWhatsapp:    this.detectWhatsapp(html),
      hasEcommerce:   this.detectEcommerce(html, url),
      hasAgenda:      this.detectAgenda(html),
      hasContactForm: this.detectContactForm(html),
    };

    this.logger.debug(
      `[QS] ${company.nombreEmpresa}: ` +
      `ig=${signals.hasInstagram} fb=${signals.hasFacebook} li=${signals.hasLinkedIn} ` +
      `wa=${signals.hasWhatsapp} ec=${signals.hasEcommerce} ag=${signals.hasAgenda}`,
    );

    return signals;
  }

  // ── Fetch ────────────────────────────────────────────────────────────────────

  private async fetchHtml(url: string): Promise<string | null> {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent':      'Mozilla/5.0 (compatible; InspyraBot/1.0; +https://inspyra.agency)',
          'Accept':          'text/html,application/xhtml+xml',
          'Accept-Language': 'es-AR,es;q=0.9,en;q=0.7',
        },
        signal:   AbortSignal.timeout(FETCH_TIMEOUT_MS),
        redirect: 'follow',
      });

      if (!res.ok) return null;
      const ct = res.headers.get('content-type') ?? '';
      if (!ct.includes('text/html')) return null;

      const text = await res.text();
      return text.slice(0, HTML_CAP);
    } catch {
      return null;
    }
  }

  // ── Detectors ────────────────────────────────────────────────────────────────

  private detectInstagram(html: string): boolean {
    // Perfil de Instagram — excluye botones de compartir, posts individuales y rutas de sistema
    return /instagram\.com\/(?!(?:p|reel|stories|explore|tags|sharer|share|_u|accounts)\/)[a-zA-Z0-9._]{2,}/i.test(html);
  }

  private detectFacebook(html: string): boolean {
    // Página o perfil — excluye sharer, SDK, pixel, grupos genéricos
    return /facebook\.com\/(?!(?:sharer|share|plugins|widgets|tr|dialog|v\d+|groups$|events$|pages\/category))[a-zA-Z0-9./-]{2,}/i.test(html);
  }

  private detectLinkedIn(html: string): boolean {
    return /linkedin\.com\/(?:company|in)\/[a-zA-Z0-9_-]+/i.test(html);
  }

  private detectWhatsapp(html: string): boolean {
    return /(?:wa\.me\/|api\.whatsapp\.com\/send|chat\.whatsapp\.com|whatsapp\.com\/send)/i.test(html);
  }

  private detectEcommerce(html: string, websiteUrl: string): boolean {
    const combined = html + ' ' + websiteUrl;

    // Plataformas conocidas por URL o scripts
    if (/cdn\.shopify\.com|myshopify\.com/i.test(combined))           return true;
    if (/(?:static\.)?tiendanube\.com|d3ugyf5w2\.cloudfront\.net/i.test(combined)) return true;
    if (/mercadoshops\.com/i.test(combined))                           return true;
    if (/static\.jumpseller\.com/i.test(combined))                     return true;
    if (/woocommerce/i.test(html))                                     return true;

    // Indicadores de carrito / checkout en HTML
    if (/wc-add-to-cart|add_to_cart|addToCart|add-to-cart/i.test(html)) return true;
    if (/agregar(?:\s+al?\s+)carrito|a[ñn]adir(?:\s+al?\s+)carrito/i.test(html)) return true;
    if (/(?:href|action)=['"][^'"]{0,80}\/(?:cart|carrito|checkout|comprar)(?:\/|\?|['"])/i.test(html)) return true;

    return false;
  }

  private detectAgenda(html: string): boolean {
    // Plataformas de agenda/reservas
    if (/calendly\.com\/[a-zA-Z0-9_-]+/i.test(html))                  return true;
    if (/(?:bookedby\.net|simplybook\.me|acuityscheduling\.com|booksy\.com)/i.test(html)) return true;
    if (/(?:turnero\.com\.ar|doctoralia\.com\.ar|mediline\.com\.ar|reservio\.com)/i.test(html)) return true;

    // Links genéricos de reserva en href
    if (/href=['"][^'"]{0,80}\/(?:reserva[rs]?|turnos?|agendar|booking)(?:\/|\?|['"])/i.test(html)) return true;

    // Clases o IDs con keywords de agenda
    if (/(?:class|id)=['"][^'"]*(?:booking|reserva|turnos|agenda)[^'"]*['"]/i.test(html)) return true;

    return false;
  }

  private detectContactForm(html: string): boolean {
    // Form con campo de email — proxy básico de formulario de contacto
    return /<form[\s\S]{0,3000}?(?:type=['"]email['"]|placeholder=['"][^'"]*(?:correo|email|mail)[^'"]*['"])/i.test(html);
  }
}
