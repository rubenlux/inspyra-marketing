import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { AuditSignals } from './analyzers/types';

interface CacheEntry {
  signals: AuditSignals;
  cachedAt: number;
}

@Injectable()
export class PlaywrightAuditService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PlaywrightAuditService.name);
  private browser: Browser | null = null;
  private readonly CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h
  private readonly cache = new Map<string, CacheEntry>();

  async onModuleInit() {
    try {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
      this.logger.log('Playwright browser singleton started');
    } catch (err) {
      this.logger.error(`Failed to start Playwright browser: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    try {
      await this.browser?.close();
      this.browser = null;
      this.logger.log('Playwright browser closed');
    } catch (_) {}
  }

  async auditWebsite(url: string | null | undefined): Promise<AuditSignals> {
    if (!url) return this.noWebsiteSignals();

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    const cacheKey = normalizedUrl.toLowerCase();

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < this.CACHE_TTL_MS) {
      this.logger.debug(`Cache hit for ${cacheKey}`);
      return cached.signals;
    }

    const signals = await this.runAudit(normalizedUrl);
    this.cache.set(cacheKey, { signals, cachedAt: Date.now() });
    return signals;
  }

  private async runAudit(url: string): Promise<AuditSignals> {
    if (!this.browser) {
      this.logger.warn('Browser not available — returning fallback signals');
      return this.errorSignals('browser_not_started');
    }

    let context: BrowserContext | null = null;
    let page: Page | null = null;
    try {
      context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        extraHTTPHeaders: {
          'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      page = await context.newPage();

      // First attempt: full load; fallback to DOMContentLoaded
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 25_000 });
      } catch {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      }

      // Let scripts execute
      await page.waitForTimeout(1500);

      const finalUrl = page.url();
      const httpsOk = finalUrl.startsWith('https://');

      const raw = await page.evaluate(() => {
        // ── HEAD signals ──────────────────────────────────────────────────
        const title = document.title || null;
        const metaDesc = document.querySelector('meta[name="description"]');
        const hasMetaDescription = !!(metaDesc && (metaDesc as HTMLMetaElement).content?.trim());
        const h1Count = document.querySelectorAll('h1').length;
        const hasCanonical = !!document.querySelector('link[rel="canonical"]');
        const hasViewport = !!document.querySelector('meta[name="viewport"]');
        const hasOgTags = !!document.querySelector('meta[property^="og:"]');
        const robotsMeta = (document.querySelector('meta[name="robots"]') as HTMLMetaElement)?.content ?? '';
        const robotsBlocked = robotsMeta.toLowerCase().includes('noindex');

        // ── Schema.org ────────────────────────────────────────────────────
        const schemaScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const schemaTypes: string[] = [];
        for (const s of schemaScripts) {
          try {
            const parsed = JSON.parse(s.textContent ?? '');
            const types = Array.isArray(parsed) ? parsed.map((x: any) => x['@type']) : [parsed['@type']];
            schemaTypes.push(...types.filter(Boolean));
          } catch (_) {}
        }
        const hasSchema = schemaTypes.length > 0;

        // ── Tech stack detection ──────────────────────────────────────────
        const bodyHtml = document.documentElement.outerHTML;
        const scripts = Array.from(document.querySelectorAll('script[src]'))
          .map(s => (s as HTMLScriptElement).src || '');

        const hasWordPress =
          bodyHtml.includes('wp-content') ||
          bodyHtml.includes('wp-includes') ||
          !!document.querySelector('link[href*="wp-content"]');
        const hasWooCommerce =
          bodyHtml.includes('woocommerce') ||
          !!document.querySelector('link[href*="woocommerce"]') ||
          !!document.querySelector('script[src*="woocommerce"]');
        const hasShopify =
          bodyHtml.includes('cdn.shopify.com') ||
          !!document.querySelector('script[src*="shopify"]') ||
          !!document.querySelector('meta[name="shopify-checkout-api-token"]');
        const hasElementor =
          !!document.querySelector('.elementor') ||
          bodyHtml.includes('elementor-kit');
        const hasReact =
          !!(window as any).React ||
          !!(window as any).ReactDOM ||
          !!document.querySelector('[data-reactroot]') ||
          !!document.querySelector('[data-react-helmet]');
        const hasNextJs =
          !!document.getElementById('__NEXT_DATA__') ||
          !!(window as any).__NEXT_DATA__;

        const technology: string[] = [];
        if (hasWordPress) technology.push('WordPress');
        if (hasWooCommerce) technology.push('WooCommerce');
        if (hasShopify) technology.push('Shopify');
        if (hasElementor) technology.push('Elementor');
        if (hasReact) technology.push('React');
        if (hasNextJs) technology.push('Next.js');

        // ── Analytics & Pixels ────────────────────────────────────────────
        const hasGTM =
          !!(window as any).google_tag_manager ||
          scripts.some(s => s.includes('googletagmanager.com'));
        const hasGA4 =
          !!(window as any).gtag ||
          !!(window as any).ga ||
          scripts.some(s => s.includes('google-analytics.com') || s.includes('googletagmanager.com'));
        const hasMetaPixel =
          !!(window as any).fbq ||
          !!(window as any)._fbq ||
          scripts.some(s => s.includes('connect.facebook.net'));
        const hasHotjar =
          !!(window as any).hj ||
          !!(window as any).hjBootstrap ||
          scripts.some(s => s.includes('hotjar.com'));
        const hasMicrosoftClarity =
          !!(window as any).clarity ||
          scripts.some(s => s.includes('clarity.ms'));
        const hasHubSpot =
          !!(window as any).hbspt ||
          scripts.some(s => s.includes('hs-scripts.com') || s.includes('hubspot.com'));
        const hasMautic =
          !!(window as any).MauticTrackingObject ||
          scripts.some(s => s.includes('mautic'));

        const hasAnalytics = hasGTM || hasGA4;
        if (hasGTM) technology.push('GTM');
        if (hasGA4 && !hasGTM) technology.push('GA4');
        if (hasHotjar) technology.push('Hotjar');
        if (hasMicrosoftClarity) technology.push('Clarity');
        if (hasHubSpot) technology.push('HubSpot');
        if (hasMautic) technology.push('Mautic');

        // ── Ecommerce / Booking signals ────────────────────────────────────
        const textLower = document.body.innerText.toLowerCase();
        const hrefAll = Array.from(document.querySelectorAll('a[href]'))
          .map(a => ((a as HTMLAnchorElement).href ?? '').toLowerCase());

        const ecommerceKeywords = ['carrito', 'cart', 'checkout', 'comprar', 'buy now', 'añadir al', 'add to cart'];
        const bookingKeywords = ['reservar', 'reservas', 'reserva tu', 'turno', 'booking', 'disponibilidad', 'calendario', 'appointment', 'book now'];

        const hasEcommerce =
          hasWooCommerce ||
          hasShopify ||
          ecommerceKeywords.some(k => textLower.includes(k)) ||
          hrefAll.some(h => h.includes('/cart') || h.includes('/checkout') || h.includes('/tienda'));
        const hasOnlineBooking =
          bookingKeywords.some(k => textLower.includes(k)) ||
          hrefAll.some(h => h.includes('/reserv') || h.includes('/booking') || h.includes('/turnos'));

        // ── Forms ─────────────────────────────────────────────────────────
        const forms = document.querySelectorAll('form');
        const hasContactForm = forms.length > 0;
        const hasLeadForm = Array.from(forms).some(f =>
          f.querySelector('input[type="email"]') !== null,
        );

        // ── Social links ──────────────────────────────────────────────────
        const socialDomains = ['instagram.com', 'facebook.com', 'linkedin.com', 'tiktok.com', 'twitter.com', 'x.com', 'youtube.com'];
        const socialLinksFound = socialDomains.filter(d =>
          hrefAll.some(h => h.includes(d)),
        );
        const hasSocialLinks = socialLinksFound.length > 0;

        // ── Google Business ───────────────────────────────────────────────
        const hasGoogleBusiness = hrefAll.some(
          h => h.includes('google.com/maps') || h.includes('maps.app.goo.gl') || h.includes('goo.gl/maps'),
        );

        // ── Local signals ─────────────────────────────────────────────────
        const phonePattern = /(\+?[\d\s\-().]{7,20})/;
        const footerText = (document.querySelector('footer')?.innerText ?? document.body.innerText).slice(0, 2000);
        const hasPhone = phonePattern.test(footerText) || textLower.includes('tel:') || hrefAll.some(h => h.startsWith('tel:'));
        const hasAddress =
          textLower.includes('calle') ||
          textLower.includes('av.') ||
          textLower.includes('avenida') ||
          textLower.includes('dirección') ||
          textLower.includes('address') ||
          textLower.includes('ciudad') ||
          !!document.querySelector('[itemprop="address"]') ||
          schemaTypes.some(t => t.includes('PostalAddress') || t.includes('LocalBusiness'));

        // ── Page weight & images ──────────────────────────────────────────
        const estimatedPageWeightKb = Math.round(document.documentElement.outerHTML.length / 1024);
        const imageCount = document.querySelectorAll('img').length;

        // ── Navigation ────────────────────────────────────────────────────
        const navEl = document.querySelector('nav') ?? document.querySelector('header');
        const mainNavSections = navEl
          ? Array.from(navEl.querySelectorAll('a'))
              .map(a => a.innerText.trim())
              .filter(t => t.length > 1 && t.length < 40)
              .slice(0, 10)
          : [];

        // ── Sitemap (detect from <link> tag) ──────────────────────────────
        const hasSitemap = !!document.querySelector('link[rel="sitemap"]');

        return {
          title,
          hasMetaDescription,
          h1Count,
          hasCanonical,
          hasViewport,
          hasOgTags,
          robotsBlocked,
          schemaTypes,
          hasSchema,
          hasWordPress,
          hasWooCommerce,
          hasShopify,
          hasElementor,
          hasReact,
          hasNextJs,
          technology,
          hasGTM,
          hasGA4,
          hasMetaPixel,
          hasHotjar,
          hasMicrosoftClarity,
          hasHubSpot,
          hasMautic,
          hasAnalytics,
          hasEcommerce,
          hasOnlineBooking,
          hasContactForm,
          hasLeadForm,
          hasSocialLinks,
          socialLinksFound,
          hasGoogleBusiness,
          hasPhone,
          hasAddress,
          estimatedPageWeightKb,
          imageCount,
          mainNavSections,
          hasSitemap,
        };
      });

      return {
        accessible: true,
        noWebsite: false,
        httpsOk,
        fetchError: null,
        ...raw,
      };
    } catch (err) {
      const msg = String((err as Error).message ?? 'unknown').slice(0, 120);
      this.logger.warn(`Playwright audit failed for ${url}: ${msg}`);
      return this.errorSignals(msg);
    } finally {
      try { await page?.close(); } catch (_) {}
      try { await context?.close(); } catch (_) {}
    }
  }

  private noWebsiteSignals(): AuditSignals {
    return this.baseSignals({ accessible: false, noWebsite: true, fetchError: 'no_website', httpsOk: null });
  }

  private errorSignals(reason: string): AuditSignals {
    return this.baseSignals({ accessible: false, noWebsite: false, fetchError: reason, httpsOk: null });
  }

  private baseSignals(overrides: Partial<AuditSignals>): AuditSignals {
    return {
      accessible: false,
      noWebsite: false,
      httpsOk: null,
      title: null,
      hasMetaDescription: false,
      h1Count: 0,
      hasCanonical: false,
      hasSchema: false,
      schemaTypes: [],
      hasViewport: false,
      hasOgTags: false,
      hasSitemap: false,
      technology: [],
      hasWordPress: false,
      hasWooCommerce: false,
      hasShopify: false,
      hasEcommerce: false,
      hasOnlineBooking: false,
      hasContactForm: false,
      hasLeadForm: false,
      hasAnalytics: false,
      hasMetaPixel: false,
      hasSocialLinks: false,
      socialLinksFound: [],
      hasGoogleBusiness: false,
      hasAddress: false,
      hasPhone: false,
      estimatedPageWeightKb: null,
      imageCount: null,
      mainNavSections: [],
      robotsBlocked: false,
      fetchError: null,
      ...overrides,
    };
  }
}
