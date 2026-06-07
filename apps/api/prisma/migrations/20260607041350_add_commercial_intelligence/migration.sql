-- CreateEnum
CREATE TYPE "ResponseType" AS ENUM ('INTERESADO', 'QUIERE_MAS_INFO', 'SIN_PRESUPUESTO', 'YA_TIENE_PROVEEDOR', 'NO_ES_PRIORIDAD', 'NO_RESPONDE', 'OTRO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OutreachActivityType" ADD VALUE 'INTERESADO';
ALTER TYPE "OutreachActivityType" ADD VALUE 'PERDIDO';

-- AlterEnum
ALTER TYPE "ProspectEstado" ADD VALUE 'INTERESADO';

-- AlterTable
ALTER TABLE "outreach_activities" ADD COLUMN     "mensajeUtilizado" TEXT,
ADD COLUMN     "proposalId" TEXT,
ADD COLUMN     "responseType" "ResponseType";
