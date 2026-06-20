-- AlterTable
ALTER TABLE "outreach_activities" ADD COLUMN "provider" TEXT,
ADD COLUMN "messageId" TEXT,
ADD COLUMN "providerMessageId" TEXT,
ADD COLUMN "fechaEnvio" TIMESTAMP(3);
