import { Injectable, Logger } from '@nestjs/common';
import type { RawCompany } from '../providers/discovery-provider.interface';
import type { ContactAcquisitionResult } from './contact-acquisition.types';

const FETCH_TIMEOUT_MS = 8_000;
const HTML_CAP         = 100_000; // 100 KB

const CONTACT_PATHS = ['/contacto', '/contact', '/contact-us'];

// Domains that produce false-positive emails
const GENERIC_EMAIL_DOMAINS = new Set([
  'shopify.com', 'wordpress.com', 'wixpress.com', 'wix.com',
  'example.com', 'sentry.io', 'tiendanube.com', 'mercadoshops.com',
  'googleapis.com', 'schema.org', 'w3.org', 'schemacorp.com',
  'cloudflare.com', 'facebook.com', 'instagram.com', 'google.com',
]);

@Injectable()
export class ContactAcquisitionService {
  private readonly logger = new Logger(ContactAcquisitionService.name);

  async acquire(company: RawCompany): Promise<ContactAcquisitionResult> {
    const empty: ContactAcquisitionResult = {
      emails: [], phones: [], whatsapp: [], instagram: [], facebook: [], linkedin: [],
    };

    if (!company.website) return empty;

    const baseUrl = company.website.startsWith('http')
      ? company.website
      : `https://${company.website}`;

    const pagesToFetch = [baseUrl, ...CONTACT_PATHS.map(p => `${baseUrl}${p}`)];

    const htmls = await Promise.all(pagesToFetch.map(url => this.fetchHtml(url)));

    const combined = htmls.filter(Boolean).join('\n');
    if (!combined) return empty;

    const result: ContactAcquisitionResult = {
      emails:    this.extractEmails(combined, baseUrl),
      phones:    this.extractPhones(combined),
      whatsapp:  this.extractWhatsapp(combined),
      instagram: this.extractInstagram(combined),
      facebook:  this.extractFacebook(combined),
      linkedin:  this.extractLinkedIn(combined),
    };

    this.logger.debug(
      `[CA] ${company.nombreEmpresa}: ` +
      `email=${result.emails.length} phone=${result.phones.length} ` +
      `wa=${result.whatsapp.length} ig=${result.instagram.length} ` +
      `fb=${result.facebook.length} li=${result.linkedin.length}`,
    );

    return result;
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

  // ── Extractors ───────────────────────────────────────────────────────────────

  private extractEmails(html: string, websiteUrl: string): string[] {
    const found = new Set<string>();

    // 1. mailto: links — highest precision
    const mailtoRe = /mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,6})/gi;
    for (const m of html.matchAll(mailtoRe)) found.add(m[1].toLowerCase());

    // 2. General email regex — lower precision, apply domain filter
    const emailRe = /\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,6})\b/g;
    for (const m of html.matchAll(emailRe)) {
      const email = m[1].toLowerCase();
      const domain = email.split('@')[1];
      if (!GENERIC_EMAIL_DOMAINS.has(domain)) found.add(email);
    }

    // Prefer emails whose domain matches the company's own website
    let websiteDomain = '';
    try { websiteDomain = new URL(websiteUrl).hostname.replace(/^www\./, ''); } catch { /* */ }

    const arr = [...found];
    if (websiteDomain) arr.sort((a, b) => {
      const aMatch = a.endsWith(websiteDomain) ? -1 : 0;
      const bMatch = b.endsWith(websiteDomain) ? -1 : 0;
      return aMatch - bMatch;
    });

    return arr.slice(0, 5);
  }

  private extractPhones(html: string): string[] {
    const found = new Set<string>();

    // 1. tel: links — most precise
    const telRe = /tel:([+\d\s()\-]{6,20})/gi;
    for (const m of html.matchAll(telRe)) {
      const raw = m[1].replace(/\s/g, '').trim();
      if (raw.length >= 6) found.add(raw);
    }

    // 2. LatAm phone patterns (Argentina, Mexico, Chile, etc.)
    const latamRe = /(?:^|[\s"'>(])(\+?(?:54|52|56|598|595|591|593|51|57|58)\s?[\d\s()\-]{8,14})(?:$|[\s"'<)&])/gm;
    for (const m of html.matchAll(latamRe)) {
      const raw = m[1].replace(/\s+/g, ' ').trim();
      if (raw.replace(/\D/g, '').length >= 8) found.add(raw);
    }

    return [...found].slice(0, 5);
  }

  private extractWhatsapp(html: string): string[] {
    const found = new Set<string>();

    const waRe = /(?:wa\.me\/|api\.whatsapp\.com\/send[?&]phone=|chat\.whatsapp\.com\/|whatsapp\.com\/send[?&]phone=)(\d+)/gi;
    for (const m of html.matchAll(waRe)) found.add(m[1]);

    return [...found].slice(0, 3);
  }

  private extractInstagram(html: string): string[] {
    const found = new Set<string>();

    // Full profile URL — exclude share, reels, explore, system paths
    const re = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?!(?:p|reel|reels|stories|explore|tags|sharer|share|_u|accounts|static|graphql|web)\/)([a-zA-Z0-9._]{2,30})\/?/gi;
    for (const m of html.matchAll(re)) {
      const handle = m[1].toLowerCase();
      if (handle.length >= 2) found.add(`https://instagram.com/${handle}`);
    }

    return [...found].slice(0, 3);
  }

  private extractFacebook(html: string): string[] {
    const found = new Set<string>();

    // Page or profile — exclude SDK, sharer, pixel, ads, login
    const re = /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?!(?:sharer|share|plugins|widgets|tr|dialog|login|oauth|v\d+\.|ads|business|pages\/category|groups$|events$))([\w./-]{2,60})\/?(?=['"?\s]|$)/gi;
    for (const m of html.matchAll(re)) {
      const path = m[1].replace(/\/$/, '');
      if (path.length >= 2) found.add(`https://facebook.com/${path}`);
    }

    return [...found].slice(0, 3);
  }

  private extractLinkedIn(html: string): string[] {
    const found = new Set<string>();

    const re = /(?:https?:\/\/)?(?:[\w]+\.)?linkedin\.com\/(company|in)\/([a-zA-Z0-9_\-]{2,60})\/?/gi;
    for (const m of html.matchAll(re)) {
      found.add(`https://linkedin.com/${m[1]}/${m[2]}`);
    }

    return [...found].slice(0, 3);
  }
}
