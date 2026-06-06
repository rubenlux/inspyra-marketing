-- CreateEnum
CREATE TYPE "CommunicationLanguage" AS ENUM ('EN', 'ES', 'PT', 'FR', 'DE');

-- AlterTable
ALTER TABLE "prospects" ADD COLUMN     "communicationLanguage" "CommunicationLanguage";
