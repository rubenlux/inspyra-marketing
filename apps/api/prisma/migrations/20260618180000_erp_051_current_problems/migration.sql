-- ERP-051: Add currentProblems field to Prospect
-- problemasEncontrados: immutable snapshot from discovery (never modified after import)
-- currentProblems: recomputed after each enrichment — source of truth for agents

ALTER TABLE "prospects" ADD COLUMN "currentProblems" TEXT[] NOT NULL DEFAULT '{}';

-- Backfill: seed currentProblems from problemasEncontrados for all existing prospects.
-- This ensures the fallback (currentProblems ?? problemasEncontrados) can eventually be removed
-- without leaving orphaned prospects with no current problem data.
UPDATE "prospects"
SET "currentProblems" = "problemasEncontrados"
WHERE cardinality("currentProblems") = 0
  AND cardinality("problemasEncontrados") > 0;
