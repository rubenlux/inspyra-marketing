# Score Audit & Taxonomy — Current State Analysis

**Date:** 2026-06-22
**Status:** Audit in progress
**Risk Level:** HIGH — multiple scores with overlapping/contradictory meanings

---

## All Scores in the System

| # | Score Name | Table | Calculated By | Range | Meaning | Consumer |
|---|-----------|-------|---|-------|---------|----------|
| 1 | **prospect.score** | prospect | SonnetEvaluator (Claude) | 0-100 | Research: "Is this worth pursuing?" | UI sorting, KPIs, Research Phase |
| 2 | **prospect.priorityScore** | prospect (virtual) | computePriorityScore() | 0-100 | Dynamic priority (pain + value + contact) | UI sorting |
| 3 | **prospectValidation.agentScore** | prospectValidation | Opportunity Agent (ERP-052) | 0-100 | Service Match First: "What problem can we solve?" | UI display, commercialScore calc |
| 4 | **prospectValidation.humanScore** | prospectValidation | Human Reviewer | 0-100 | Human override of agentScore | Used for drift analysis, discarded otherwise |
| 5 | **enrichmentResult.opportunityScore** | enrichmentResult | OpportunityEngine (Rules) | 0-100 | Technical opportunities detected (gaps) | commercialScore calc |
| 6 | **prospect.commercialScore** | prospect | Enrichment Review | 0-100 | **Final score** = (opportunityScore + agentScore) / 2 | UI display to sales |

---

## The Contradiction Problem

### Example: Beleni Propiedades

```
prospect.score (Research)             = 65  ← Claude: "Hay oportunidades"
↓
prospectValidation.agentScore         = 35  ← Service Match: "Baja oportunidad"
↓
enrichmentResult.opportunityScore     = 0   ← Rules: "Sin gaps detectados"
↓
prospect.commercialScore              = 17  ← Final: (0 + 35) / 2 = 17
```

**The issue:** All 6 scores measure **different things** but are treated as if they measure the **same thing** (commercial value).

---

## What Each Score Actually Means

### 1. prospect.score (Research Score)
**Definition:** "Based on discovery signals alone, should we pursue this company?"

**Inputs:**
- hasWebsite
- hasInstagram
- hasFacebook
- hasSeo
- hasEcommerce
- Industry
- Employeee count
- Revenue estimate

**Logic:** SonnetEvaluator (Claude) + EVALUATE_OPPORTUNITY_PROMPT

**Output:**
- Score: 0-100
- Reasoning: commercial judgment
- Problems: discovery-level gaps
- Ticket estimate

**Question answered:** "Is this prospect fundamentally viable?"

**Current usage:** ✅ Correct (Research phase)

---

### 2. prospect.priorityScore (Priority Score)
**Definition:** "How urgent is this lead relative to others?"

**Inputs:**
- prospect.score (research)
- prospect.nivelOportunidad (ALTA/MEDIA/BAJA)
- Contactability signals

**Logic:** Dynamic calculation in findAll() → not persisted

**Formula:** Mentioned but not fully visible
```
Priority = Pain (0-70) + Business Value (0-20) + Contactability (0-10)
```

**Problem:** ⚠️ This is calculated AFTER commercialScore exists, so it's redundant.

**Current usage:** ⚠️ Used for UI sorting, but confuses with Commercial Score

---

### 3. prospectValidation.agentScore (Opportunity Agent Score)
**Definition:** "ERP-052: Service Match First — can we solve a problem here?"

**Inputs:**
- problemasEncontrados (discovery)
- currentProblems (enrichment)
- Service catalog matching
- Contact availability

**Logic:** 
```
Score = matchFitScore (0-40) + impactScore (0-40) + contactScore (0-20)
```

**Output:**
- Score: 0-100
- Services recommended
- Ticket estimate
- Reasoning

**Question answered:** "Does this prospect have a problem INSPYRA can solve?"

**Problem:** ⚠️ Used as **input to commercialScore**, but measures something different from research.score

**Current usage:** ⚠️ Conflated with "opportunity" but actually measures "service fit"

---

### 4. prospectValidation.humanScore (Human Score)
**Definition:** "What does a human reviewer think of the AI's assessment?"

**Inputs:**
- prospectValidation.agentScore
- Human judgment

**Logic:** Manual override (optional)

**Output:** 0-100

**Question answered:** "Did the AI get this right?"

**Problem:** ❌ Rarely used. Drift analysis shows AI ≠ human, but human scores aren't applied.

**Current usage:** ❌ Captured but not used in decisioning

---

### 5. enrichmentResult.opportunityScore (Enrichment Opportunity Score)
**Definition:** "How many technical opportunities did we detect in the audit?"

**Inputs:**
- AuditSignals (Playwright)
- OpportunityEngine rules (deterministic)

**Logic:**
```
activatedCount = opportunities.filter(o => o.activated).length
opportunityScore = min(100, activatedCount * 25)
```

**Output:** 0-100

**Question answered:** "How many detectable technical gaps exist?"

**Problem:** ❌ For "perfect" companies (web ✅, instagram ✅, etc), this returns 0
- But doesn't mean there's NO opportunity (e.g., email marketing, CRM, automation)

**Current usage:** ❌ Used in commercialScore, but rules-based logic doesn't capture commercial reasoning

---

### 6. prospect.commercialScore (Commercial Score)
**Definition:** "Final scoring shown to sales team"

**Inputs:**
```
opportunityScore (from enrichment) +
agentScore (from validation)
÷ 2
```

**Logic:**
```
commercialScore = floor((opportunityScore + agentScore) / 2)
```

**Output:** 0-100

**Question answered:** "How valuable is this prospect commercially?"

**Problem:** ❌ **CRITICAL** — Averages two scores that:
1. Are calculated by different engines (rules vs. Claude)
2. Measure different things (technical gaps vs. service fit)
3. Have different contexts (enrichment vs. validation)

---

## The Scoring Taxonomy Problem

### Current (Broken) Model:
```
6 independent scores
→ no clear hierarchy
→ contradictory signals
→ averaging incompatible inputs
→ sales team confused
```

### Correct Model (To Define):

**Option A: Sequential Gates**
```
Research Score (initial qualification)
  ↓
IF Research Score < 40 → DISCARD
  ↓
Enrichment Analysis (technical deep-dive)
  ↓
IF no commercial opportunity → DISCARD
  ↓
Commercial Score = Final consensus
```

**Option B: Weighted Combination**
```
Commercial Score =
  50% Research Score (initial judgment) +
  30% Opportunity Agent Score (service fit) +
  20% Enrichment Score (technical depth)
```

**Option C: Separate Tracks**
```
Sales Score = Research Score (what research said)
Technical Score = Enrichment Score (what audit found)
Commercial Score = Human judgment integrating both
```

---

## Immediate Risks

If EnrichmentEvaluator is implemented WITHOUT defining scoring taxonomy:

1. ❌ Will add ANOTHER score (Enrichment Evaluation Score)
2. ❌ Will be combined with existing scores using same broken averaging
3. ❌ Will create NEW contradictions
4. ❌ Sales team will have 7+ scores instead of clarity

**Example:**
```
research.score = 65
prospectValidation.agentScore = 35
enrichmentResult.opportunityScore = 0
enrichmentEvaluator.opportunityScore = 82  ← NEW: Claude reasoning
prospect.commercialScore = 54  ← Which score to use?
```

---

## Required Before Implementing EnrichmentEvaluator

### Step 1: Decide Hierarchy
Choose ONE of:
- [ ] Sequential gates (Research → Enrichment → Commercial)
- [ ] Weighted formula (50% + 30% + 20%)
- [ ] Separate tracks (Sales | Technical | Commercial)
- [ ] Other: _____

### Step 2: Define Each Score's Purpose
For EACH score, document:
- [ ] Why it exists
- [ ] What question it answers
- [ ] Who uses it
- [ ] How it drives decisions

### Step 3: Clean Up Existing Scores
Decide the fate of each:

| Score | Keep? | Rationale |
|-------|-------|-----------|
| prospect.score | ? | Research phase - seems essential |
| prospect.priorityScore | ? | Dynamic, unpersisted - redundant? |
| prospectValidation.agentScore | ? | Service fit - different from research |
| prospectValidation.humanScore | ? | Unused - delete or implement properly? |
| enrichmentResult.opportunityScore | ? | Rules-based - replace with Claude? |
| prospect.commercialScore | ? | Unclear formula - redefine or remove? |

### Step 4: Design EnrichmentEvaluator Score
Once hierarchy is clear, design:
- [ ] What it measures (commercial opportunity from technical evidence)
- [ ] How it fits into hierarchy
- [ ] How it combines with existing scores

---

## Recommendation

**DO NOT** implement EnrichmentEvaluator until scoring taxonomy is finalized.

The system already has **6 scores competing for authority**. Adding a 7th without clarity will multiply contradictions.

**Correct order:**
1. **Define** scoring taxonomy (1 hour meeting)
2. **Document** which scores to keep/deprecate
3. **Clean up** existing scores (remove redundant, implement unused)
4. **Design** EnrichmentEvaluator in context of final taxonomy
5. **Implement** with confidence that it fits

---

## Open Questions for Stakeholders

1. What does "Commercial Score" mean to sales? What decisions does it drive?
2. When sales sees prospect.score = 65, what do they assume about the prospect?
3. When they see commercialScore = 17, how do they reconcile the difference?
4. Why is prospectValidation.humanScore captured but not used?
5. Should enrichmentResult.opportunityScore be determined by Claude (reasoning) or rules (detection)?
