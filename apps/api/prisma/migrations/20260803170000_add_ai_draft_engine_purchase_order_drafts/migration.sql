-- CreateEnum
CREATE TYPE "AiDraftCapability" AS ENUM ('PurchaseOrder');

-- CreateEnum
CREATE TYPE "AiDraftStatus" AS ENUM ('ReviewPending', 'ReviewSaved', 'Committed', 'Discarded');

-- CreateEnum
CREATE TYPE "AiDraftInputType" AS ENUM ('Pdf', 'Image', 'Text');

-- CreateEnum
CREATE TYPE "AiDraftFieldDecision" AS ENUM ('Suggested', 'Accepted', 'Edited', 'Ignored', 'Manual');

-- AlterTable
ALTER TABLE "PurchaseOrder"
ADD COLUMN "quotationDate" TIMESTAMP(3),
ADD COLUMN "validUntilDate" TIMESTAMP(3),
ADD COLUMN "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "paymentTerms" TEXT,
ADD COLUMN "deliveryAddress" TEXT,
ADD COLUMN "eventReference" TEXT;

-- CreateTable
CREATE TABLE "AiDraft" (
    "id" TEXT NOT NULL,
    "capability" "AiDraftCapability" NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" "AiDraftStatus" NOT NULL DEFAULT 'ReviewPending',
    "extractionAdapter" TEXT NOT NULL,
    "draftPayload" JSONB NOT NULL,
    "approvedPayload" JSONB,
    "warnings" JSONB,
    "committedTargetId" TEXT,
    "committedAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiDraftSourceDocument" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "inputType" "AiDraftInputType" NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "contentText" TEXT,
    "contentBase64" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiDraftSourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiDraftExtractedField" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "fieldPath" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "suggestedValue" JSONB,
    "finalValue" JSONB,
    "confidenceScore" DOUBLE PRECISION,
    "sourceReference" TEXT,
    "decision" "AiDraftFieldDecision" NOT NULL DEFAULT 'Suggested',
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "lowConfidence" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDraftExtractedField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiDraft_organizationId_idx" ON "AiDraft"("organizationId");

-- CreateIndex
CREATE INDEX "AiDraft_capability_idx" ON "AiDraft"("capability");

-- CreateIndex
CREATE INDEX "AiDraft_status_idx" ON "AiDraft"("status");

-- CreateIndex
CREATE INDEX "AiDraft_createdByUserId_idx" ON "AiDraft"("createdByUserId");

-- CreateIndex
CREATE INDEX "AiDraftSourceDocument_draftId_idx" ON "AiDraftSourceDocument"("draftId");

-- CreateIndex
CREATE UNIQUE INDEX "AiDraftExtractedField_draftId_fieldPath_key" ON "AiDraftExtractedField"("draftId", "fieldPath");

-- CreateIndex
CREATE INDEX "AiDraftExtractedField_draftId_idx" ON "AiDraftExtractedField"("draftId");

-- CreateIndex
CREATE INDEX "AiDraftExtractedField_decision_idx" ON "AiDraftExtractedField"("decision");

-- AddForeignKey
ALTER TABLE "AiDraft" ADD CONSTRAINT "AiDraft_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDraft" ADD CONSTRAINT "AiDraft_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDraftSourceDocument" ADD CONSTRAINT "AiDraftSourceDocument_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "AiDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDraftExtractedField" ADD CONSTRAINT "AiDraftExtractedField_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "AiDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;