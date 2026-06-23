import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnrichmentEvaluatorService {
  private readonly logger = new Logger(EnrichmentEvaluatorService.name);
  private readonly anthropicApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.anthropicApiKey = this.configService.get<string>('ANTHROPIC_API_KEY') || '';
  }

  async evaluate(input: {
    prospect: { id: string; nombreEmpresa: string; rubro: string; ciudad?: string; website?: string };
    contact: { email?: string; telefono?: string; whatsapp?: string; instagram?: string; facebook?: string; linkedin?: string };
    signals: Record<string, any>;
  }): Promise<{
    score: number;
    problems: string[];
    opportunities: Array<{ title: string; description: string; estimatedTicketUsd: number; priority: string; reasoning: string }>;
    recommendedServices: string[];
    totalEstimatedTicketUsd: number;
    reasoning: string;
  }> {
    const prompt = `You are a commercial opportunity analyst for Inspyra, a digital services agency.

Analyze this prospect and return a JSON commercial assessment.

PROSPECT:
- Name: ${input.prospect.nombreEmpresa}
- Industry: ${input.prospect.rubro}
- City: ${input.prospect.ciudad || 'Unknown'}
- Website: ${input.prospect.website || 'No website'}

CONTACT CHANNELS:
- Email: ${input.contact.email || 'No'}
- Phone: ${input.contact.telefono || 'No'}
- WhatsApp: ${input.contact.whatsapp || 'No'}
- Instagram: ${input.contact.instagram || 'No'}
- Facebook: ${input.contact.facebook || 'No'}
- LinkedIn: ${input.contact.linkedin || 'No'}

WEBSITE AUDIT SIGNALS:
${this.formatSignals(input.signals)}

INSPYRA SERVICES:
Web Development, Web Redesign, Local SEO, Google Business, CRM, Automation, Landing Pages, Social Management, Meta Ads, Google Ads, Ecommerce, Hosting, Maintenance.

TASK:
1. Identify problems (gaps in digital presence, technical issues, contact availability)
2. Identify opportunities (which services would solve these problems)
3. Calculate score (0-100):
   - 0-30: Low (missing core signals)
   - 31-65: Medium (some gaps, moderate fit)
   - 66-100: High (clear problems, strong fit, contactable)
4. Recommend 2-4 services by priority

RETURN ONLY this JSON (no markdown, no explanation):

{
  "score": <0-100>,
  "problems": ["<problem1>", "<problem2>"],
  "opportunities": [
    {
      "title": "<opportunity>",
      "description": "<why matters>",
      "estimatedTicketUsd": <number>,
      "priority": "<CRITICAL|HIGH|MEDIUM|LOW>",
      "reasoning": "<why>"
    }
  ],
  "recommendedServices": ["<service1>", "<service2>"],
  "totalEstimatedTicketUsd": <number>,
  "reasoning": "<summary>"
}`;

    try {
      const response = await this.callClaudeAPI(prompt);
      const parsed = JSON.parse(response);
      this.logger.log(`Evaluation complete for ${input.prospect.nombreEmpresa}: score=${parsed.score}`);
      return parsed;
    } catch (error) {
      this.logger.error(`Evaluation failed: ${error.message}`);
      throw error;
    }
  }

  private async callClaudeAPI(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-1-20250805',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private formatSignals(signals: Record<string, any>): string {
    const pairs = Object.entries(signals)
      .filter(([, v]) => v !== null && v !== undefined)
      .slice(0, 15)
      .map(([k, v]) => `- ${k}: ${JSON.stringify(v).substring(0, 50)}`)
      .join('\n');

    return pairs || '(no signals)';
  }
}
