CREATE TYPE "ContractTemplateSourceType" AS ENUM ('Designed', 'Imported');
CREATE TYPE "ContractTemplateStatus" AS ENUM ('Draft', 'Approved', 'Archived');
CREATE TYPE "CommercialAgreementStatus" AS ENUM ('Draft', 'UnderReview', 'Approved', 'Sent', 'PartiallySigned', 'Executed', 'Superseded', 'Cancelled');

CREATE TABLE "ContractTemplate" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "sourceType" "ContractTemplateSourceType" NOT NULL,
  "importedFileName" TEXT,
  "importedFileReference" TEXT,
  "content" TEXT NOT NULL,
  "mergeFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" "ContractTemplateStatus" NOT NULL DEFAULT 'Draft',
  "createdByUserId" TEXT NOT NULL,
  "approvedByUserId" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommercialAgreement" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "commercialWorkspaceId" TEXT,
  "templateId" TEXT,
  "counterpartyType" TEXT NOT NULL,
  "counterpartyId" TEXT,
  "counterpartyName" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" "CommercialAgreementStatus" NOT NULL DEFAULT 'Draft',
  "currentVersion" INTEGER NOT NULL DEFAULT 1,
  "createdByUserId" TEXT NOT NULL,
  "approvedByUserId" TEXT,
  "approvedAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "executedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommercialAgreement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommercialAgreementVersion" (
  "id" TEXT NOT NULL,
  "agreementId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "partyASnapshot" JSONB NOT NULL,
  "partyBSnapshot" JSONB NOT NULL,
  "commercialSnapshot" JSONB NOT NULL,
  "sourceReferences" JSONB,
  "generatedByAi" BOOLEAN NOT NULL DEFAULT false,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommercialAgreementVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContractTemplate_organizationId_name_key" ON "ContractTemplate"("organizationId", "name");
CREATE INDEX "ContractTemplate_organizationId_status_idx" ON "ContractTemplate"("organizationId", "status");
CREATE INDEX "ContractTemplate_createdByUserId_idx" ON "ContractTemplate"("createdByUserId");
CREATE INDEX "ContractTemplate_approvedByUserId_idx" ON "ContractTemplate"("approvedByUserId");
CREATE INDEX "CommercialAgreement_organizationId_status_idx" ON "CommercialAgreement"("organizationId", "status");
CREATE INDEX "CommercialAgreement_eventId_status_idx" ON "CommercialAgreement"("eventId", "status");
CREATE INDEX "CommercialAgreement_commercialWorkspaceId_idx" ON "CommercialAgreement"("commercialWorkspaceId");
CREATE INDEX "CommercialAgreement_templateId_idx" ON "CommercialAgreement"("templateId");
CREATE INDEX "CommercialAgreement_createdByUserId_idx" ON "CommercialAgreement"("createdByUserId");
CREATE INDEX "CommercialAgreement_approvedByUserId_idx" ON "CommercialAgreement"("approvedByUserId");
CREATE UNIQUE INDEX "CommercialAgreementVersion_agreementId_version_key" ON "CommercialAgreementVersion"("agreementId", "version");
CREATE INDEX "CommercialAgreementVersion_createdByUserId_idx" ON "CommercialAgreementVersion"("createdByUserId");

ALTER TABLE "ContractTemplate" ADD CONSTRAINT "ContractTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContractTemplate" ADD CONSTRAINT "ContractTemplate_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContractTemplate" ADD CONSTRAINT "ContractTemplate_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommercialAgreement" ADD CONSTRAINT "CommercialAgreement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialAgreement" ADD CONSTRAINT "CommercialAgreement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialAgreement" ADD CONSTRAINT "CommercialAgreement_commercialWorkspaceId_fkey" FOREIGN KEY ("commercialWorkspaceId") REFERENCES "CommercialWorkspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommercialAgreement" ADD CONSTRAINT "CommercialAgreement_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ContractTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommercialAgreement" ADD CONSTRAINT "CommercialAgreement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommercialAgreement" ADD CONSTRAINT "CommercialAgreement_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommercialAgreementVersion" ADD CONSTRAINT "CommercialAgreementVersion_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "CommercialAgreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialAgreementVersion" ADD CONSTRAINT "CommercialAgreementVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
