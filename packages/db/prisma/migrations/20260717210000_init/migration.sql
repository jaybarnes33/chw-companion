-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PatientType" AS ENUM ('MATERNAL', 'NEWBORN', 'UNDER5');

-- CreateEnum
CREATE TYPE "RiskTier" AS ENUM ('RED', 'YELLOW', 'GREEN');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('REFERRED', 'IN_TRANSIT', 'ARRIVED', 'RESOLVED');

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "chwId" TEXT NOT NULL,
    "patientType" "PatientType" NOT NULL,
    "patientName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3),
    "riskTier" "RiskTier" NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistResponse" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "answer" BOOLEAN NOT NULL,

    CONSTRAINT "ChecklistResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'REFERRED',
    "facility" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Case_chwId_idx" ON "Case"("chwId");

-- CreateIndex
CREATE INDEX "Case_riskTier_idx" ON "Case"("riskTier");

-- CreateIndex
CREATE INDEX "Case_patientType_idx" ON "Case"("patientType");

-- CreateIndex
CREATE INDEX "TimelineEvent_caseId_idx" ON "TimelineEvent"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistResponse_caseId_itemKey_key" ON "ChecklistResponse"("caseId", "itemKey");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_caseId_key" ON "Referral"("caseId");

-- AddForeignKey
ALTER TABLE "ChecklistResponse" ADD CONSTRAINT "ChecklistResponse_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
