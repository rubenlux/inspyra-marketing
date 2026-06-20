-- CreateEnum
CREATE TYPE "AutomationLevel" AS ENUM ('MANUAL', 'SEMI_AUTO', 'FULL_AUTO');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ResearchJobType" AS ENUM ('MANUAL', 'DISCOVERY');

-- CreateEnum
CREATE TYPE "DiscoverySource" AS ENUM ('HAIKU_GENERATED', 'WEB_SEARCH', 'GOOGLE_PLACES', 'DIRECTORY_SCRAPE');

-- AlterTable
ALTER TABLE "research_candidates" ADD COLUMN     "auditScore" INTEGER,
ADD COLUMN     "campaignFit" BOOLEAN,
ADD COLUMN     "commercialScore" INTEGER,
ADD COLUMN     "domainNormalized" TEXT,
ADD COLUMN     "duplicateOfId" TEXT,
ADD COLUMN     "isDuplicate" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "research_jobs" ADD COLUMN     "campaign_id" TEXT,
ADD COLUMN     "jobType" "ResearchJobType" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "sourceType" "DiscoverySource" NOT NULL DEFAULT 'HAIKU_GENERATED';

-- CreateTable
CREATE TABLE "discovery_campaigns" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "strategyPrompt" TEXT,
    "servicesToSell" TEXT[],
    "targetMarkets" TEXT[],
    "targetIndustries" TEXT[],
    "problemSignals" TEXT[],
    "opportunitySignals" TEXT[],
    "threshold" INTEGER NOT NULL DEFAULT 65,
    "automationLevel" "AutomationLevel" NOT NULL DEFAULT 'MANUAL',
    "preferredSource" "DiscoverySource" NOT NULL DEFAULT 'WEB_SEARCH',
    "defaultLimit" INTEGER NOT NULL DEFAULT 20,
    "status" "CampaignStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovery_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "discovery_campaigns_tenantId_status_idx" ON "discovery_campaigns"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "discovery_campaigns_tenantId_slug_key" ON "discovery_campaigns"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "research_candidates_tenantId_domainNormalized_idx" ON "research_candidates"("tenantId", "domainNormalized");

-- CreateIndex
CREATE INDEX "research_jobs_tenantId_campaign_id_idx" ON "research_jobs"("tenantId", "campaign_id");

-- CreateIndex
CREATE INDEX "research_jobs_tenantId_jobType_createdAt_idx" ON "research_jobs"("tenantId", "jobType", "createdAt");

-- AddForeignKey
ALTER TABLE "discovery_campaigns" ADD CONSTRAINT "discovery_campaigns_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_jobs" ADD CONSTRAINT "research_jobs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "discovery_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
