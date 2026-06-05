-- CreateEnum
CREATE TYPE "MarketProfile" AS ENUM ('ARGENTINA', 'LATAM', 'USA', 'CANADA', 'EUROPE');

-- CreateEnum
CREATE TYPE "ProposalType" AS ENUM ('OUTREACH', 'COMMERCIAL');

-- AlterTable
ALTER TABLE "proposals" ADD COLUMN     "proposalType" "ProposalType" NOT NULL DEFAULT 'OUTREACH';

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "marketProfile" "MarketProfile" NOT NULL DEFAULT 'ARGENTINA';
