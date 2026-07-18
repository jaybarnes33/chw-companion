-- CreateEnum
CREATE TYPE "PatientSex" AS ENUM ('FEMALE', 'MALE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AgeUnit" AS ENUM ('DAYS', 'MONTHS', 'YEARS');

-- CreateEnum
CREATE TYPE "MaternalStatus" AS ENUM ('PREGNANT', 'POSTPARTUM');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "patientSex" "PatientSex",
ADD COLUMN     "ageValue" INTEGER,
ADD COLUMN     "ageUnit" "AgeUnit",
ADD COLUMN     "community" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "caregiverName" TEXT,
ADD COLUMN     "caregiverPhone" TEXT,
ADD COLUMN     "maternalStatus" "MaternalStatus",
ADD COLUMN     "gestationalWeeks" INTEGER,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "consentAt" TIMESTAMP(3),
ADD COLUMN     "status" "CaseStatus" NOT NULL DEFAULT 'IN_PROGRESS';

-- Make riskTier nullable until assessment is scored
ALTER TABLE "Case" ALTER COLUMN "riskTier" DROP NOT NULL;

-- Backfill completed seed/demo cases
UPDATE "Case" SET "status" = 'COMPLETED' WHERE "riskTier" IS NOT NULL;

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status");

-- CreateIndex
CREATE INDEX "Case_community_idx" ON "Case"("community");
