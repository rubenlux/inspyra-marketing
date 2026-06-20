-- AlterTable
ALTER TABLE "prospects" ADD COLUMN     "isLegacy" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "prospects_tenantId_isLegacy_idx" ON "prospects"("tenantId", "isLegacy");
