-- CreateEnum
CREATE TYPE "ResearchJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "research_jobs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "limit" INTEGER NOT NULL DEFAULT 10,
    "status" "ResearchJobStatus" NOT NULL DEFAULT 'PENDING',
    "prospectsFound" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "agentOutput" TEXT,
    "createdBy" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "research_jobs_tenantId_status_idx" ON "research_jobs"("tenantId", "status");

-- CreateIndex
CREATE INDEX "research_jobs_tenantId_createdAt_idx" ON "research_jobs"("tenantId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "research_jobs" ADD CONSTRAINT "research_jobs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
