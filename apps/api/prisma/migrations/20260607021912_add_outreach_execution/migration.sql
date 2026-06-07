-- CreateEnum
CREATE TYPE "ContactChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'OTRO');

-- CreateEnum
CREATE TYPE "OutreachActivityType" AS ENUM ('CONTACTADO', 'SEGUIMIENTO', 'SIN_RESPUESTA', 'RESPONDIO', 'REUNION_AGENDADA', 'NOTA');

-- AlterTable
ALTER TABLE "prospects" ADD COLUMN     "contactChannel" "ContactChannel",
ADD COLUMN     "contactedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "outreach_activities" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "type" "OutreachActivityType" NOT NULL,
    "channel" "ContactChannel",
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outreach_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "outreach_activities_tenantId_prospectId_idx" ON "outreach_activities"("tenantId", "prospectId");

-- CreateIndex
CREATE INDEX "outreach_activities_prospectId_createdAt_idx" ON "outreach_activities"("prospectId", "createdAt");

-- AddForeignKey
ALTER TABLE "outreach_activities" ADD CONSTRAINT "outreach_activities_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
