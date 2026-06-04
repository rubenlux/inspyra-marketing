-- CreateEnum
CREATE TYPE "RejectionReason" AS ENUM ('SIN_PRESUPUESTO', 'SIN_DECISION_MAKER', 'EMPRESA_PEQUENA', 'MERCADO_INCORRECTO', 'COMPETENCIA_FUERTE', 'YA_TIENE_PROVEEDOR', 'OTRO');

-- AlterTable
ALTER TABLE "prospect_validations" ADD COLUMN     "decisionFactors" JSONB;

-- CreateTable
CREATE TABLE "validation_feedback" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "validationId" TEXT NOT NULL,
    "rejectionReason" "RejectionReason" NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validation_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "validation_feedback_validationId_key" ON "validation_feedback"("validationId");

-- CreateIndex
CREATE INDEX "validation_feedback_tenantId_rejectionReason_idx" ON "validation_feedback"("tenantId", "rejectionReason");

-- AddForeignKey
ALTER TABLE "validation_feedback" ADD CONSTRAINT "validation_feedback_validationId_fkey" FOREIGN KEY ("validationId") REFERENCES "prospect_validations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_feedback" ADD CONSTRAINT "validation_feedback_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
