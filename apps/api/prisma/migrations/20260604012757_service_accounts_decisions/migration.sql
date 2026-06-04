-- CreateTable
CREATE TABLE "service_accounts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "scopes" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "service_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_tokens" (
    "id" TEXT NOT NULL,
    "serviceAccountId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "service_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_decisions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "runId" TEXT,
    "prospectId" TEXT,
    "dealId" TEXT,
    "decision" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "confidence" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_accounts_tenantId_isActive_idx" ON "service_accounts"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "service_accounts_tenantId_agentName_key" ON "service_accounts"("tenantId", "agentName");

-- CreateIndex
CREATE UNIQUE INDEX "service_tokens_tokenHash_key" ON "service_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "service_tokens_tokenHash_idx" ON "service_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "agent_decisions_tenantId_agentId_idx" ON "agent_decisions"("tenantId", "agentId");

-- CreateIndex
CREATE INDEX "agent_decisions_prospectId_idx" ON "agent_decisions"("prospectId");

-- CreateIndex
CREATE INDEX "agent_decisions_runId_idx" ON "agent_decisions"("runId");

-- AddForeignKey
ALTER TABLE "service_accounts" ADD CONSTRAINT "service_accounts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_tokens" ADD CONSTRAINT "service_tokens_serviceAccountId_fkey" FOREIGN KEY ("serviceAccountId") REFERENCES "service_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
