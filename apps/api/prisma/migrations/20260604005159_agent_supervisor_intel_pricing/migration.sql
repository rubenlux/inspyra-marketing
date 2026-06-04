-- CreateEnum
CREATE TYPE "AgentRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "AgentTrigger" AS ENUM ('HUMAN', 'SUPERVISOR', 'HEARTBEAT', 'WEBHOOK');

-- CreateTable
CREATE TABLE "agent_runs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" "AgentRunStatus" NOT NULL DEFAULT 'RUNNING',
    "triggeredBy" "AgentTrigger" NOT NULL DEFAULT 'HUMAN',
    "inputHash" TEXT,
    "inputSummary" TEXT,
    "outputSummary" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_costs" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_errors" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "errorCode" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "stackTrace" TEXT,
    "toolName" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_errors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_metrics" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "metricValue" DECIMAL(12,4) NOT NULL,
    "period" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_intelligence_rules" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "problemPattern" TEXT NOT NULL,
    "impactoDescripcion" TEXT NOT NULL,
    "serviciosRecomendados" TEXT[],
    "prioridad" "Prioridad" NOT NULL,
    "ticketEstimadoUsd" DECIMAL(12,2) NOT NULL,
    "bundleSugerido" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_intelligence_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_runs_tenantId_agentId_idx" ON "agent_runs"("tenantId", "agentId");

-- CreateIndex
CREATE INDEX "agent_runs_tenantId_status_idx" ON "agent_runs"("tenantId", "status");

-- CreateIndex
CREATE INDEX "agent_runs_tenantId_startedAt_idx" ON "agent_runs"("tenantId", "startedAt");

-- CreateIndex
CREATE INDEX "agent_costs_runId_idx" ON "agent_costs"("runId");

-- CreateIndex
CREATE INDEX "agent_errors_runId_idx" ON "agent_errors"("runId");

-- CreateIndex
CREATE INDEX "agent_metrics_tenantId_agentId_period_idx" ON "agent_metrics"("tenantId", "agentId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "agent_metrics_tenantId_agentId_metricName_period_key" ON "agent_metrics"("tenantId", "agentId", "metricName", "period");

-- CreateIndex
CREATE INDEX "service_intelligence_rules_tenantId_activo_idx" ON "service_intelligence_rules"("tenantId", "activo");

-- AddForeignKey
ALTER TABLE "agent_costs" ADD CONSTRAINT "agent_costs_runId_fkey" FOREIGN KEY ("runId") REFERENCES "agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_errors" ADD CONSTRAINT "agent_errors_runId_fkey" FOREIGN KEY ("runId") REFERENCES "agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_intelligence_rules" ADD CONSTRAINT "service_intelligence_rules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
