-- CreateEnum
CREATE TYPE "EnrichmentJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "EnrichmentReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "prospects" ADD COLUMN     "commercialScore" INTEGER;

-- CreateTable
CREATE TABLE "enrichment_jobs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "status" "EnrichmentJobStatus" NOT NULL DEFAULT 'PENDING',
    "agentOutput" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrichment_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrichment_results" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "whatsapp" TEXT,
    "formularioWeb" TEXT,
    "contactable" BOOLEAN NOT NULL DEFAULT false,
    "contactabilityScore" INTEGER NOT NULL DEFAULT 0,
    "confianza" TEXT,
    "googleBusiness" TEXT,
    "linkedin" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "direccion" TEXT,
    "anioFundacion" INTEGER,
    "empleadosReal" INTEGER,
    "nombreDecidsor" TEXT,
    "rolDecidsor" TEXT,
    "linkedinDecidsor" TEXT,
    "reviewStatus" "EnrichmentReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "recommendedStatus" TEXT,
    "recommendNotes" TEXT,
    "recommendedBy" TEXT,
    "rawOutput" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrichment_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "enrichment_jobs_tenantId_status_idx" ON "enrichment_jobs"("tenantId", "status");

-- CreateIndex
CREATE INDEX "enrichment_jobs_tenantId_prospectId_idx" ON "enrichment_jobs"("tenantId", "prospectId");

-- CreateIndex
CREATE UNIQUE INDEX "enrichment_results_prospectId_key" ON "enrichment_results"("prospectId");

-- CreateIndex
CREATE UNIQUE INDEX "enrichment_results_jobId_key" ON "enrichment_results"("jobId");

-- CreateIndex
CREATE INDEX "enrichment_results_tenantId_prospectId_idx" ON "enrichment_results"("tenantId", "prospectId");

-- CreateIndex
CREATE INDEX "enrichment_results_tenantId_reviewStatus_idx" ON "enrichment_results"("tenantId", "reviewStatus");

-- CreateIndex
CREATE INDEX "enrichment_results_tenantId_recommendedStatus_idx" ON "enrichment_results"("tenantId", "recommendedStatus");

-- CreateIndex
CREATE INDEX "prospects_tenantId_commercialScore_idx" ON "prospects"("tenantId", "commercialScore");

-- AddForeignKey
ALTER TABLE "enrichment_jobs" ADD CONSTRAINT "enrichment_jobs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrichment_jobs" ADD CONSTRAINT "enrichment_jobs_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrichment_results" ADD CONSTRAINT "enrichment_results_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrichment_results" ADD CONSTRAINT "enrichment_results_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "enrichment_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
