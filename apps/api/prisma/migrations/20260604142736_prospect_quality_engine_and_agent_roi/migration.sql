-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('PENDING', 'VALIDATED', 'REJECTED');

-- CreateTable
CREATE TABLE "prospect_validations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "agentScore" INTEGER NOT NULL,
    "humanScore" INTEGER,
    "status" "ValidationStatus" NOT NULL DEFAULT 'PENDING',
    "servicesRecommended" TEXT[],
    "estimatedTicketUsd" DECIMAL(12,2),
    "prioridad" "Prioridad" NOT NULL DEFAULT 'MEDIA',
    "reasoning" TEXT,
    "notes" TEXT,
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospect_validations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_roi" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "prospectsCreated" INTEGER NOT NULL DEFAULT 0,
    "prospectsValidated" INTEGER NOT NULL DEFAULT 0,
    "meetingsGenerated" INTEGER NOT NULL DEFAULT 0,
    "dealsCreated" INTEGER NOT NULL DEFAULT 0,
    "revenueGeneratedUsd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "costTokensUsd" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_roi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prospect_validations_prospectId_key" ON "prospect_validations"("prospectId");

-- CreateIndex
CREATE INDEX "prospect_validations_tenantId_status_idx" ON "prospect_validations"("tenantId", "status");

-- CreateIndex
CREATE INDEX "agent_roi_tenantId_agentName_idx" ON "agent_roi"("tenantId", "agentName");

-- CreateIndex
CREATE UNIQUE INDEX "agent_roi_tenantId_agentName_period_key" ON "agent_roi"("tenantId", "agentName", "period");

-- AddForeignKey
ALTER TABLE "prospect_validations" ADD CONSTRAINT "prospect_validations_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_validations" ADD CONSTRAINT "prospect_validations_validatedBy_fkey" FOREIGN KEY ("validatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
