-- CreateEnum
CREATE TYPE "DiscardReason" AS ENUM ('NO_SERVICE_MATCH', 'ALREADY_SOLVED', 'LOW_IMPACT', 'INSUFFICIENT_DATA');

-- AlterEnum
ALTER TYPE "ValidationStatus" ADD VALUE 'DISCARDED';

-- AlterTable
ALTER TABLE "prospect_validations" ADD COLUMN     "discardReason" "DiscardReason";

-- AlterTable
ALTER TABLE "prospects" ALTER COLUMN "currentProblems" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "prospect_validations_tenantId_discardReason_idx" ON "prospect_validations"("tenantId", "discardReason");
