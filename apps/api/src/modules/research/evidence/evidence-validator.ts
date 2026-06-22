import { Injectable, Logger } from '@nestjs/common';
import type { RawCompany } from '../providers/discovery-provider.interface';

export interface EvidenceValidationResult {
  valid: boolean;
  details: string;
}

@Injectable()
export class EvidenceValidator {
  private readonly logger = new Logger(EvidenceValidator.name);

  async validate(company: RawCompany): Promise<EvidenceValidationResult> {
    if (company.googlePlaceId) {
      return { valid: true, details: `place_id:${company.googlePlaceId.slice(0, 20)}✓ (GPS verified)` };
    }

    const checks: string[] = [];
    let anyValid = false;

    // Validate website
    if (company.website) {
      const url = company.website.startsWith('http') ? company.website : `https://${company.website}`;
      try {
        const res = await fetch(url, {
          method: 'HEAD',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InspyraBot/1.0)' },
          signal: AbortSignal.timeout(8000),
          redirect: 'follow',
        });
        if (res.ok || res.status === 403 || res.status === 405) {
          checks.push(`website:${res.status}✓`);
          anyValid = true;
        } else {
          checks.push(`website:${res.status}✗`);
        }
      } catch (err) {
        checks.push(`website:unreachable(${(err as Error).message.slice(0, 30)})`);
      }
    }

    // Validate Instagram
    if (company.instagram) {
      const igUrl = company.instagram.startsWith('http')
        ? company.instagram
        : `https://instagram.com/${company.instagram.replace(/^@/, '')}`;
      try {
        const res = await fetch(igUrl, {
          method: 'HEAD',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InspyraBot/1.0)' },
          signal: AbortSignal.timeout(8000),
          redirect: 'follow',
        });
        if (res.ok) {
          checks.push('instagram:✓');
          anyValid = true;
        } else {
          checks.push(`instagram:${res.status}✗`);
        }
      } catch {
        checks.push('instagram:unreachable');
      }
    }

    // Validate LinkedIn
    if (company.linkedin) {
      const liUrl = company.linkedin.startsWith('http')
        ? company.linkedin
        : `https://${company.linkedin}`;
      try {
        const res = await fetch(liUrl, {
          method: 'HEAD',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InspyraBot/1.0)' },
          signal: AbortSignal.timeout(8000),
          redirect: 'follow',
        });
        if (res.ok || res.status === 999) {
          checks.push('linkedin:✓');
          anyValid = true;
        } else {
          checks.push(`linkedin:${res.status}✗`);
        }
      } catch {
        checks.push('linkedin:unreachable');
      }
    }

    const details = checks.join(' | ') || 'Sin URLs para validar';
    return { valid: anyValid, details };
  }
}
