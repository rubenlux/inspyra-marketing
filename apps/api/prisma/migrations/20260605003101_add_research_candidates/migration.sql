-- CreateEnum
CREATE TYPE "ResearchCandidateStatus" AS ENUM ('DISCOVERED', 'DISCARDED', 'PROMOTED');

-- AlterTable
ALTER TABLE "research_jobs" ADD COLUMN     "candidatesFound" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "research_candidates" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "candidateIndex" INTEGER NOT NULL,
    "nombreEmpresa" TEXT NOT NULL,
    "ciudad" TEXT,
    "pais" TEXT,
    "rubro" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "linkedin" TEXT,
    "descripcion" TEXT,
    "empleadosEstimado" INTEGER,
    "anosFundacion" TEXT,
    "presenciaDigital" JSONB,
    "facturacionEstimada" TEXT,
    "status" "ResearchCandidateStatus" NOT NULL DEFAULT 'DISCOVERED',
    "score" INTEGER,
    "scoreBreakdown" JSONB,
    "reasoning" TEXT,
    "discardReason" TEXT,
    "problemasDetectados" TEXT[],
    "oportunidadDetectada" TEXT,
    "servicioSugerido" TEXT,
    "estimatedTicketUsd" INTEGER,
    "prospectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "research_candidates_jobId_idx" ON "research_candidates"("jobId");

-- CreateIndex
CREATE INDEX "research_candidates_tenantId_status_idx" ON "research_candidates"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "research_candidates" ADD CONSTRAINT "research_candidates_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "research_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
