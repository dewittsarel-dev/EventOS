CREATE TYPE "RequirementImpactReportStatus" AS ENUM ('PendingReview', 'Applied', 'Cancelled');
CREATE TYPE "RequirementImpactChangeType" AS ENUM ('Added', 'Removed', 'Changed', 'QuantityChanged', 'OverrideProtected');
CREATE TYPE "RequirementImpactDecision" AS ENUM ('Pending', 'Apply', 'KeepCurrent');

CREATE TABLE "RequirementImpactReport" (
    "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "eventId" TEXT NOT NULL,
    "baselineRequirementSetId" TEXT NOT NULL, "status" "RequirementImpactReportStatus" NOT NULL DEFAULT 'PendingReview',
    "affectedItems" INTEGER NOT NULL, "newItems" INTEGER NOT NULL, "removedItems" INTEGER NOT NULL,
    "plannerOverrides" INTEGER NOT NULL, "requiresProcurementReview" BOOLEAN NOT NULL, "businessImpact" JSONB NOT NULL,
    "createdByUserId" TEXT NOT NULL, "resolvedByUserId" TEXT, "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RequirementImpactReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RequirementImpactChange" (
    "id" TEXT NOT NULL, "impactReportId" TEXT NOT NULL, "requirementCode" TEXT NOT NULL,
    "changeType" "RequirementImpactChangeType" NOT NULL,
    "decision" "RequirementImpactDecision" NOT NULL DEFAULT 'Pending',
    "previousItem" JSONB, "proposedItem" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RequirementImpactChange_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RequirementImpactReport_organizationId_idx" ON "RequirementImpactReport"("organizationId");
CREATE INDEX "RequirementImpactReport_eventId_status_idx" ON "RequirementImpactReport"("eventId", "status");
CREATE INDEX "RequirementImpactReport_baselineRequirementSetId_idx" ON "RequirementImpactReport"("baselineRequirementSetId");
CREATE INDEX "RequirementImpactReport_createdByUserId_idx" ON "RequirementImpactReport"("createdByUserId");
CREATE INDEX "RequirementImpactReport_resolvedByUserId_idx" ON "RequirementImpactReport"("resolvedByUserId");
CREATE UNIQUE INDEX "RequirementImpactChange_impactReportId_requirementCode_key" ON "RequirementImpactChange"("impactReportId", "requirementCode");
CREATE INDEX "RequirementImpactChange_impactReportId_decision_idx" ON "RequirementImpactChange"("impactReportId", "decision");

ALTER TABLE "RequirementImpactReport" ADD CONSTRAINT "RequirementImpactReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RequirementImpactReport" ADD CONSTRAINT "RequirementImpactReport_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RequirementImpactReport" ADD CONSTRAINT "RequirementImpactReport_baselineRequirementSetId_fkey" FOREIGN KEY ("baselineRequirementSetId") REFERENCES "RequirementSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RequirementImpactReport" ADD CONSTRAINT "RequirementImpactReport_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RequirementImpactReport" ADD CONSTRAINT "RequirementImpactReport_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RequirementImpactChange" ADD CONSTRAINT "RequirementImpactChange_impactReportId_fkey" FOREIGN KEY ("impactReportId") REFERENCES "RequirementImpactReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
