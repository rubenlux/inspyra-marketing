-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "TamanoEmpresa" AS ENUM ('MICRO', 'PEQUENA', 'MEDIANA', 'GRANDE');

-- CreateEnum
CREATE TYPE "NivelOportunidad" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "Prioridad" AS ENUM ('BAJA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "ProspectEstado" AS ENUM ('NUEVO', 'INVESTIGADO', 'ENRIQUECIDO', 'LISTO_OUTREACH', 'CONTACTADO', 'RESPONDIO', 'REUNION_AGENDADA', 'PASO_A_PIPELINE', 'CONVERTIDO', 'DESCARTADO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "ProspectFuente" AS ENUM ('GOOGLE_MAPS', 'INSTAGRAM', 'LINKEDIN', 'META_ADS_LEAD', 'GOOGLE_ADS_LEAD', 'FORMULARIO_WEB', 'WHATSAPP', 'CSV_IMPORT', 'REFERRAL', 'MANUAL');

-- CreateEnum
CREATE TYPE "DetectadoPor" AS ENUM ('IA', 'MANUAL');

-- CreateEnum
CREATE TYPE "DealEtapa" AS ENUM ('NUEVO_INGRESO', 'CONTACTADO', 'DESCUBRIMIENTO', 'REUNION_AGENDADA', 'REUNION_REALIZADA', 'PROPUESTA_PREPARACION', 'PROPUESTA_ENVIADA', 'NEGOCIACION', 'CIERRE_PENDIENTE', 'GANADO', 'PERDIDO', 'PAUSADO');

-- CreateEnum
CREATE TYPE "ServicioInteres" AS ENUM ('WEB', 'SEO', 'ADS', 'BRANDING', 'HOSTING', 'SOFTWARE', 'EMAIL_MKT', 'CLOUD_INFRA', 'OTRO');

-- CreateEnum
CREATE TYPE "DealFuente" AS ENUM ('PROSPECTS', 'CAMPAIGNS', 'FOLLOWUP', 'REFERRAL', 'MEETINGS', 'UPSELL', 'FORM');

-- CreateEnum
CREATE TYPE "Temperatura" AS ENUM ('FRIA', 'TIBIA', 'CALIENTE');

-- CreateEnum
CREATE TYPE "Urgencia" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "MotivoPerdida" AS ENUM ('PRECIO', 'TIMING', 'SIN_RESPUESTA', 'COMPETENCIA', 'PRESUPUESTO_BAJO', 'CANCELADO', 'DECISION_INTERNA', 'OTRO');

-- CreateEnum
CREATE TYPE "RiesgoIA" AS ENUM ('BAJO', 'MEDIO', 'ALTO');

-- CreateEnum
CREATE TYPE "MovidoPorTipo" AS ENUM ('HUMAN', 'BOT');

-- CreateEnum
CREATE TYPE "EstadoCuenta" AS ENUM ('ONBOARDING', 'ACTIVO', 'PAUSADO', 'SUSPENDIDO', 'CANCELADO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'UNICO');

-- CreateEnum
CREATE TYPE "Satisfaccion" AS ENUM ('BAJA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "RiesgoChurn" AS ENUM ('BAJO', 'MEDIO', 'ALTO', 'CRITICO');

-- CreateEnum
CREATE TYPE "ServicioCategoria" AS ENUM ('WEB', 'SEO', 'ADS', 'BRANDING', 'HOSTING', 'CLOUD', 'SOFTWARE', 'EMAIL_MKT', 'SOPORTE', 'CONSULTORIA');

-- CreateEnum
CREATE TYPE "BillingModel" AS ENUM ('UNICO', 'MENSUAL', 'TRIMESTRAL', 'ANUAL', 'POR_HORAS', 'POR_PROYECTO', 'SUSCRIPCION');

-- CreateEnum
CREATE TYPE "ServiceEstado" AS ENUM ('PENDIENTE_ACTIVACION', 'ONBOARDING', 'ACTIVO', 'EN_EJECUCION', 'EN_REVISION', 'ESPERANDO_CLIENTE', 'PAUSADO', 'RENOVACION_PENDIENTE', 'FINALIZADO', 'CANCELADO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "DeliverableEstado" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'APROBADO', 'RECHAZADO');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "lastLoginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospects" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombreEmpresa" TEXT NOT NULL,
    "nombreContacto" TEXT,
    "cargo" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "pais" TEXT,
    "ciudad" TEXT,
    "direccion" TEXT,
    "rubro" TEXT,
    "tamanoEmpresa" "TamanoEmpresa",
    "empleadosEstimado" INTEGER,
    "website" TEXT,
    "instagram" TEXT,
    "linkedin" TEXT,
    "facebook" TEXT,
    "googleBusiness" TEXT,
    "oportunidadDetectada" TEXT,
    "problemasEncontrados" TEXT[],
    "nivelOportunidad" "NivelOportunidad",
    "servicioSugerido" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "prioridad" "Prioridad" NOT NULL DEFAULT 'MEDIA',
    "ownerId" TEXT,
    "ultimoContacto" TIMESTAMP(3),
    "proximoSeguimiento" TIMESTAMP(3),
    "estado" "ProspectEstado" NOT NULL DEFAULT 'NUEVO',
    "fuente" "ProspectFuente" NOT NULL DEFAULT 'MANUAL',
    "detectadoPor" "DetectadoPor" NOT NULL DEFAULT 'MANUAL',
    "creadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "prospects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "contactoNombre" TEXT NOT NULL,
    "contactoEmail" TEXT,
    "contactoTelefono" TEXT,
    "servicioInteres" "ServicioInteres" NOT NULL,
    "valorEstimadoUsd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "probabilidadCierre" INTEGER NOT NULL DEFAULT 0,
    "fechaEstimadaCierre" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,
    "fuenteOrigen" "DealFuente" NOT NULL DEFAULT 'PROSPECTS',
    "etapa" "DealEtapa" NOT NULL DEFAULT 'NUEVO_INGRESO',
    "temperatura" "Temperatura" NOT NULL DEFAULT 'TIBIA',
    "urgencia" "Urgencia" NOT NULL DEFAULT 'MEDIA',
    "estancada" BOOLEAN NOT NULL DEFAULT false,
    "ultimoMovimientoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proximaAccion" TEXT,
    "proximaAccionAt" TIMESTAMP(3),
    "prospectId" TEXT,
    "clienteId" TEXT,
    "motivoPerdida" "MotivoPerdida",
    "notaCierre" TEXT,
    "fechaCierreReal" TIMESTAMP(3),
    "notasInternas" TEXT,
    "resumenIa" TEXT,
    "riesgoPerdidaIa" "RiesgoIA",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_stage_history" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "etapaAnterior" "DealEtapa" NOT NULL,
    "etapaNueva" "DealEtapa" NOT NULL,
    "movidoPorId" TEXT,
    "movidoPorTipo" "MovidoPorTipo" NOT NULL DEFAULT 'HUMAN',
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_stage_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "nombreComercial" TEXT NOT NULL,
    "cuitIdentificacion" TEXT,
    "pais" TEXT,
    "ciudad" TEXT,
    "direccion" TEXT,
    "accountOwnerId" TEXT NOT NULL,
    "estadoCuenta" "EstadoCuenta" NOT NULL DEFAULT 'ONBOARDING',
    "fechaAlta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dealOrigenId" TEXT,
    "comercialCierreId" TEXT,
    "ticketInicialUsd" DECIMAL(12,2),
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MENSUAL',
    "feeMensualUsd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "feeAnualUsd" DECIMAL(12,2),
    "ultimaFacturaAt" TIMESTAMP(3),
    "proximoVencimientoAt" TIMESTAMP(3),
    "deudaPendienteUsd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "revenueLifetimeUsd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "mrrUsd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "dominio" TEXT,
    "sslExpiraAt" TIMESTAMP(3),
    "emailService" TEXT,
    "healthScore" INTEGER NOT NULL DEFAULT 100,
    "satisfaccionEstimada" "Satisfaccion" NOT NULL DEFAULT 'ALTA',
    "riesgoChurn" "RiesgoChurn" NOT NULL DEFAULT 'BAJO',
    "oportunidadUpsell" BOOLEAN NOT NULL DEFAULT false,
    "oportunidadCrosssell" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_contacts" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cargo" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "whatsapp" TEXT,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "ServicioCategoria" NOT NULL,
    "descripcionAlcance" TEXT,
    "estado" "ServiceEstado" NOT NULL DEFAULT 'PENDIENTE_ACTIVACION',
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "duracionEstimadaDias" INTEGER,
    "billingModel" "BillingModel" NOT NULL,
    "precioVendidoUsd" DECIMAL(12,2) NOT NULL,
    "precioActualUsd" DECIMAL(12,2) NOT NULL,
    "costeInternoUsd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "margenEstimadoPct" DECIMAL(5,2),
    "mrrUsd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ownerId" TEXT NOT NULL,
    "equipoIds" TEXT[],
    "entregables" TEXT[],
    "sla" TEXT,
    "renovacionAutomatica" BOOLEAN NOT NULL DEFAULT false,
    "proximaRenovacionAt" TIMESTAMP(3),
    "historialRenovaciones" INTEGER NOT NULL DEFAULT 0,
    "dealOrigenId" TEXT,
    "observaciones" TEXT,
    "motivoCancelacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_deliverables" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "estado" "DeliverableEstado" NOT NULL DEFAULT 'PENDIENTE',
    "fechaEsperada" TIMESTAMP(3),
    "fechaEntregado" TIMESTAMP(3),
    "urlArchivo" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_catalog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "ServicioCategoria" NOT NULL,
    "descripcionDefault" TEXT,
    "precioBaseUsd" DECIMAL(12,2) NOT NULL,
    "billingModelDefault" "BillingModel" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_email_key" ON "users"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refreshToken_key" ON "user_sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_resource_resourceId_idx" ON "audit_logs"("tenantId", "resource", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_createdAt_idx" ON "audit_logs"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "prospects_tenantId_estado_idx" ON "prospects"("tenantId", "estado");

-- CreateIndex
CREATE INDEX "prospects_tenantId_score_idx" ON "prospects"("tenantId", "score");

-- CreateIndex
CREATE INDEX "prospects_tenantId_ownerId_idx" ON "prospects"("tenantId", "ownerId");

-- CreateIndex
CREATE INDEX "deals_tenantId_etapa_idx" ON "deals"("tenantId", "etapa");

-- CreateIndex
CREATE INDEX "deals_tenantId_ownerId_idx" ON "deals"("tenantId", "ownerId");

-- CreateIndex
CREATE INDEX "deals_tenantId_estancada_idx" ON "deals"("tenantId", "estancada");

-- CreateIndex
CREATE INDEX "deal_stage_history_dealId_idx" ON "deal_stage_history"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_dealOrigenId_key" ON "clients"("dealOrigenId");

-- CreateIndex
CREATE INDEX "clients_tenantId_estadoCuenta_idx" ON "clients"("tenantId", "estadoCuenta");

-- CreateIndex
CREATE INDEX "clients_tenantId_accountOwnerId_idx" ON "clients"("tenantId", "accountOwnerId");

-- CreateIndex
CREATE INDEX "clients_tenantId_riesgoChurn_idx" ON "clients"("tenantId", "riesgoChurn");

-- CreateIndex
CREATE INDEX "client_contacts_clientId_idx" ON "client_contacts"("clientId");

-- CreateIndex
CREATE INDEX "services_tenantId_clientId_idx" ON "services"("tenantId", "clientId");

-- CreateIndex
CREATE INDEX "services_tenantId_estado_idx" ON "services"("tenantId", "estado");

-- CreateIndex
CREATE INDEX "services_tenantId_ownerId_idx" ON "services"("tenantId", "ownerId");

-- CreateIndex
CREATE INDEX "service_deliverables_serviceId_idx" ON "service_deliverables"("serviceId");

-- CreateIndex
CREATE INDEX "service_catalog_tenantId_categoria_idx" ON "service_catalog"("tenantId", "categoria");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_stage_history" ADD CONSTRAINT "deal_stage_history_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_stage_history" ADD CONSTRAINT "deal_stage_history_movidoPorId_fkey" FOREIGN KEY ("movidoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_accountOwnerId_fkey" FOREIGN KEY ("accountOwnerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_dealOrigenId_fkey" FOREIGN KEY ("dealOrigenId") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_comercialCierreId_fkey" FOREIGN KEY ("comercialCierreId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_dealOrigenId_fkey" FOREIGN KEY ("dealOrigenId") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_deliverables" ADD CONSTRAINT "service_deliverables_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_catalog" ADD CONSTRAINT "service_catalog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
