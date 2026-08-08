CREATE TYPE "ProcurementPackageStatus" AS ENUM ('Draft', 'Analysed', 'SolutionSelected', 'QuotationRequested');
CREATE TYPE "ProcurementSolutionStrategy" AS ENUM ('LowestCost', 'LowestRisk', 'FewestSuppliers', 'HighestConfidence', 'PreferLocal', 'Balanced');

CREATE TABLE "ProcurementPackage" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "eventId" TEXT NOT NULL,
  "requirementSetId" TEXT NOT NULL, "name" TEXT NOT NULL, "category" TEXT NOT NULL,
  "status" "ProcurementPackageStatus" NOT NULL DEFAULT 'Draft', "policy" JSONB NOT NULL,
  "createdByUserId" TEXT NOT NULL, "quotationRequestedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProcurementPackage_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProcurementPackageItem" (
  "procurementPackageId" TEXT NOT NULL, "requirementItemId" TEXT NOT NULL,
  CONSTRAINT "ProcurementPackageItem_pkey" PRIMARY KEY ("procurementPackageId", "requirementItemId")
);
CREATE TABLE "ProcurementAnalysis" (
  "id" TEXT NOT NULL, "procurementPackageId" TEXT NOT NULL, "policySnapshot" JSONB NOT NULL,
  "credibleSolutionCount" INTEGER NOT NULL, "reasonFewerThanFive" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProcurementAnalysis_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProcurementSolution" (
  "id" TEXT NOT NULL, "procurementPackageId" TEXT NOT NULL, "procurementAnalysisId" TEXT NOT NULL,
  "rank" INTEGER NOT NULL, "strategy" "ProcurementSolutionStrategy" NOT NULL, "label" TEXT NOT NULL,
  "estimatedTotalCost" DOUBLE PRECISION, "currency" TEXT, "confidenceScore" DOUBLE PRECISION NOT NULL,
  "riskScore" DOUBLE PRECISION NOT NULL, "supplierCount" INTEGER NOT NULL, "explanation" TEXT NOT NULL,
  "tradeOffs" JSONB NOT NULL, "selectedByUserId" TEXT, "selectedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProcurementSolution_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProcurementSolutionAllocation" (
  "id" TEXT NOT NULL, "procurementSolutionId" TEXT NOT NULL, "requirementItemId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL, "supplierName" TEXT NOT NULL, "quantity" DOUBLE PRECISION NOT NULL,
  "estimatedCost" DOUBLE PRECISION, "confidenceScore" DOUBLE PRECISION NOT NULL,
  "riskScore" DOUBLE PRECISION NOT NULL, "deliveryCapability" TEXT NOT NULL,
  CONSTRAINT "ProcurementSolutionAllocation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProcurementPackage_organizationId_idx" ON "ProcurementPackage"("organizationId");
CREATE INDEX "ProcurementPackage_eventId_status_idx" ON "ProcurementPackage"("eventId", "status");
CREATE INDEX "ProcurementPackage_requirementSetId_idx" ON "ProcurementPackage"("requirementSetId");
CREATE INDEX "ProcurementPackage_createdByUserId_idx" ON "ProcurementPackage"("createdByUserId");
CREATE INDEX "ProcurementPackageItem_requirementItemId_idx" ON "ProcurementPackageItem"("requirementItemId");
CREATE INDEX "ProcurementAnalysis_procurementPackageId_createdAt_idx" ON "ProcurementAnalysis"("procurementPackageId", "createdAt");
CREATE UNIQUE INDEX "ProcurementSolution_procurementAnalysisId_rank_key" ON "ProcurementSolution"("procurementAnalysisId", "rank");
CREATE INDEX "ProcurementSolution_procurementPackageId_idx" ON "ProcurementSolution"("procurementPackageId");
CREATE INDEX "ProcurementSolution_selectedByUserId_idx" ON "ProcurementSolution"("selectedByUserId");
CREATE UNIQUE INDEX "ProcurementSolutionAllocation_procurementSolutionId_requirementItemId_key" ON "ProcurementSolutionAllocation"("procurementSolutionId", "requirementItemId");
CREATE INDEX "ProcurementSolutionAllocation_requirementItemId_idx" ON "ProcurementSolutionAllocation"("requirementItemId");
CREATE INDEX "ProcurementSolutionAllocation_supplierId_idx" ON "ProcurementSolutionAllocation"("supplierId");

ALTER TABLE "ProcurementPackage" ADD CONSTRAINT "ProcurementPackage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcurementPackage" ADD CONSTRAINT "ProcurementPackage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcurementPackage" ADD CONSTRAINT "ProcurementPackage_requirementSetId_fkey" FOREIGN KEY ("requirementSetId") REFERENCES "RequirementSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProcurementPackage" ADD CONSTRAINT "ProcurementPackage_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProcurementPackageItem" ADD CONSTRAINT "ProcurementPackageItem_procurementPackageId_fkey" FOREIGN KEY ("procurementPackageId") REFERENCES "ProcurementPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcurementPackageItem" ADD CONSTRAINT "ProcurementPackageItem_requirementItemId_fkey" FOREIGN KEY ("requirementItemId") REFERENCES "RequirementItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProcurementAnalysis" ADD CONSTRAINT "ProcurementAnalysis_procurementPackageId_fkey" FOREIGN KEY ("procurementPackageId") REFERENCES "ProcurementPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcurementSolution" ADD CONSTRAINT "ProcurementSolution_procurementPackageId_fkey" FOREIGN KEY ("procurementPackageId") REFERENCES "ProcurementPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcurementSolution" ADD CONSTRAINT "ProcurementSolution_procurementAnalysisId_fkey" FOREIGN KEY ("procurementAnalysisId") REFERENCES "ProcurementAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcurementSolution" ADD CONSTRAINT "ProcurementSolution_selectedByUserId_fkey" FOREIGN KEY ("selectedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProcurementSolutionAllocation" ADD CONSTRAINT "ProcurementSolutionAllocation_procurementSolutionId_fkey" FOREIGN KEY ("procurementSolutionId") REFERENCES "ProcurementSolution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcurementSolutionAllocation" ADD CONSTRAINT "ProcurementSolutionAllocation_requirementItemId_fkey" FOREIGN KEY ("requirementItemId") REFERENCES "RequirementItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
