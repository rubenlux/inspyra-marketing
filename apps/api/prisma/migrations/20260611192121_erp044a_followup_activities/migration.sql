-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OutreachActivityType" ADD VALUE 'FOLLOWUP_1';
ALTER TYPE "OutreachActivityType" ADD VALUE 'FOLLOWUP_2';
ALTER TYPE "OutreachActivityType" ADD VALUE 'FOLLOWUP_3';
ALTER TYPE "OutreachActivityType" ADD VALUE 'RESPUESTA_RECIBIDA';

-- AlterTable
ALTER TABLE "prospects" ADD COLUMN     "followUpPaused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "followUpPausedUntil" TIMESTAMP(3);
