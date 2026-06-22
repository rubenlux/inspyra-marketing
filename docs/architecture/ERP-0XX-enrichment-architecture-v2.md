# ERP-0XX — Enrichment Architecture V2

**Status:** Architecture Discovery (not yet implemented)
**Date:** 2026-06-22
**Discovery:** Claude Code investigation into Research vs. Enrichment evaluation contradiction

---

## Problem Identified

**Current State (Broken):**
```
Research Layer     → SonnetEvaluator (Claude)
                   → Research Score: 65 ✅

Enrichment Layer   → OpportunityEngine (Rules only)
                   → Opportunity Score: 0 ❌

Result: Same prospect evaluated contradictively by two different engines
```

**Example:** Beleni Propiedades
- Research Claude: "Score 65 (MEDIA) — hay oportunidades comerciales"
- Enrichment Rules: "Score 0 (sin oportunidades) — no encontré gaps"

---

## Proposed Architecture: Enrichment Pipeline V2

### Layer 1: Discovery
**Responsibility:** Find potential companies
- Google Maps Discovery
- Evidence Validation
- Qualification Signals Detection
- Contact Acquisition

**Output:** ResearchCandidate

---

### Layer 2: Research Evaluation (SonnetEvaluator — Claude)
**Responsibility:** "Is this worth pursuing commercially?"

**Input:**
- Company name, city, industry, website
- Social signals (Instagram, LinkedIn, Facebook)
- Contact data

**Output:**
```typescript
{
  "researchScore": 0-100,      // ← Research's judgment
  "reasoning": string,           // ← Why this score
  "problemasDetectados": [],     // ← High-level gaps
  "estimatedTicketUsd": number,  // ← Initial estimate
  "action": "PROMOTE" | "DISCARD"
}
```

**Current:** ✅ Implemented (SonnetEvaluator)

---

### Layer 3: Prospect Creation
**State:** NUEVO (new) if action = PROMOTE

---

### Layer 4: Enrichment - Technical Audit (Playwright)
**Responsibility:** Generate objective, verifiable technical signals

**Input:** Website URL

**Output:** AuditSignals
```typescript
{
  "accessible": boolean,
  "ssl": {status, expiryDate},
  "performance": {lcp, cls, ttfb},
  "seo": {metaDescription, canonical, sitemap, robots},
  "schema": {detected, types},
  "cms": string | null,
  "headers": {hsts, csp, x_frame_options},
  "regressions": string[]  // ← Specific, verifiable issues
}
```

**Current:** ✅ Implemented (PlaywrightAuditService)

---

### Layer 5: Technical Issue Detection (OpportunityEngine)
**Responsibility:** Translate AuditSignals → structured technical issues

**Input:** AuditSignals

**Output:** TechnicalIssues (deterministic, rule-based)
```typescript
[
  "Missing Schema.org markup",
  "No XML Sitemap",
  "Slow LCP (>4s)",
  "No HSTS header",
  "No local SEO optimization",
  "Missing meta descriptions"
]
```

**Note:** OpportunityEngine should NOT assign commercial value—just detect issues.

**Current:** ⚠️ Implemented but conflated with commercial scoring (WRONG)

---

### Layer 6: Enrichment Evaluation (EnrichmentEvaluator — Claude) **[MISSING]**
**Responsibility:** "Given technical evidence + research score, what commercial opportunities exist?"

**Input:**
```typescript
{
  "company": {name, city, industry, website, contact},
  "research": {score, reasoning, estimatedTicket},
  "auditSignals": AuditSignals,
  "technicalIssues": string[]  // ← From OpportunityEngine
}
```

**Output:**
```typescript
{
  "opportunityScore": 0-100,
  "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "services": ["SEO Local", "Optimización Web", ...],
  "estimatedTicketUsd": number,  // ← Refined from research
  "reasoning": string,
  "proposalOutline": string,
  "nextBestAction": string
}
```

**Current:** ❌ Missing (replaced by OpportunityEngine rules)

---

### Layer 7: Human Review
**Responsibility:** Approve/reject/modify enrichment findings

**Input:** EnrichmentEvaluator output

**Action:**
- APPROVE → Estado: ENRIQUECIDO
- REJECT → Estado: DESCARTADO (manual)
- MODIFY → Update and APPROVE

---

## Data Model Gaps

### Required to implement EnrichmentEvaluator:

| Field | Table | Status |
|-------|-------|--------|
| opportunityScore | enrichmentResult | ✅ exists |
| services[] | enrichmentResult | ✅ exists |
| estimatedTicket | enrichmentResult | ✅ exists |
| reasoning | enrichmentResult | ✅ exists |
| proposalOutline | enrichmentResult | ❌ MISSING |
| nextBestAction | enrichmentResult | ❌ MISSING |

### Missing fields to add to enrichmentResult:
- `proposalOutline` (TEXT)
- `nextBestAction` (VARCHAR)

---

## Component Responsibilities (Clear Separation)

| Component | Input | Output | Logic | Who |
|-----------|-------|--------|-------|-----|
| SonnetEvaluator | Discovery signals | Research score | Claude reasoning | Research |
| PlaywrightAudit | Website URL | Technical signals | Deterministic audit | Playwright |
| OpportunityEngine | AuditSignals | Technical issues | Rules/detection | Rules |
| **EnrichmentEvaluator** | **All above** | **Opportunity score** | **Claude reasoning** | **Claude (TO IMPLEMENT)** |

---

## Key Insight

The fundamental problem discovered:

**Research and Enrichment were trying to solve the same business question with different tools:**

- Research: "Should we pursue this company?" → Claude → YES (score 65)
- Enrichment: "What opportunities exist?" → Rules → NO (score 0)

**The fix:** Separate concerns completely:

- Research answers: "Is it WORTH it?" (business question)
- Enrichment answers: "What CAN we sell?" (technical + commercial)
- Both use Claude, but with different contexts and prompts

---

## Next Steps

1. ✅ Document this architecture (DONE)
2. ⏳ Audit data model (add proposalOutline, nextBestAction fields)
3. ⏳ Design EnrichmentEvaluator prompt (specialized for enrichment context)
4. ⏳ Implement EnrichmentEvaluator service
5. ⏳ Wire into enrichment pipeline (replace OpportunityEngine rules with Claude)
6. ⏳ Test with real prospects (Beleni, RBA, etc.)

---

## Related Issues

- **Architecture Contradiction:** Research (Claude) vs. Enrichment (Rules) solving same problem
- **Data Loss Bug:** Fixed in earlier commits (INSUFFICIENT_DATA gate, Data Sufficiency)
- **Opportunity Score Zero:** Root cause is OpportunityEngine rules not designed for commercial reasoning
