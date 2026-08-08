CREATE TYPE "RequirementSetStatus" AS ENUM ('Draft', 'Reviewed', 'Approved');
CREATE TYPE "RequirementStatus" AS ENUM ('Draft', 'Reviewed', 'Approved', 'InProcurement', 'PartiallyFulfilled', 'SupplierSelected', 'Ordered', 'Delivered', 'Fulfilled', 'Completed', 'Cancelled');
CREATE TYPE "RequirementType" AS ENUM ('Product', 'Service', 'Resource');
CREATE TYPE "RequirementQuantitySource" AS ENUM ('AiCalculated', 'PlannerOverride', 'Manual');
CREATE TYPE "RequirementFulfilmentStrategy" AS ENUM ('OwnInventory', 'Marketplace', 'ExternalSupplier', 'Hybrid', 'Undecided');
CREATE TYPE "RequirementDependencyLevel" AS ENUM ('Direct', 'Calculated', 'Design');

CREATE TABLE "RequirementSet" (
    "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "eventId" TEXT NOT NULL,
    "eventDesignVersionId" TEXT NOT NULL, "version" INTEGER NOT NULL,
    "status" "RequirementSetStatus" NOT NULL DEFAULT 'Draft', "createdByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT, "approvedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RequirementSet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RequirementItem" (
    "id" TEXT NOT NULL, "requirementSetId" TEXT NOT NULL, "requirementCode" TEXT NOT NULL,
    "requirementVersion" INTEGER NOT NULL, "category" TEXT NOT NULL, "requirementType" "RequirementType" NOT NULL,
    "name" TEXT NOT NULL, "description" TEXT, "specification" JSONB, "images" JSONB,
    "quantityRequired" DOUBLE PRECISION NOT NULL, "unit" TEXT NOT NULL, "quantitySource" "RequirementQuantitySource" NOT NULL,
    "plannerOverride" BOOLEAN NOT NULL DEFAULT false, "overrideReason" TEXT,
    "deliveryDate" TIMESTAMP(3), "collectionDate" TIMESTAMP(3), "setupDate" TIMESTAMP(3), "removalDate" TIMESTAMP(3), "requiredTime" TEXT,
    "venue" TEXT, "deliveryArea" TEXT, "setupArea" TEXT, "gps" TEXT,
    "status" "RequirementStatus" NOT NULL DEFAULT 'Draft', "fulfilmentStrategy" "RequirementFulfilmentStrategy" NOT NULL DEFAULT 'Undecided',
    "supplierAllocation" JSONB, "estimatedBudgetCents" INTEGER, "quotedPriceCents" INTEGER, "approvedPriceCents" INTEGER, "actualCostCents" INTEGER,
    "aiConfidence" DOUBLE PRECISION, "aiRecommendation" TEXT, "alternativeSuggestions" JSONB, "similarMarketplaceItems" JSONB, "riskWarnings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RequirementItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RequirementDependency" (
    "id" TEXT NOT NULL, "requirementSetId" TEXT NOT NULL, "sourceRequirementItemId" TEXT NOT NULL,
    "targetRequirementItemId" TEXT NOT NULL, "level" "RequirementDependencyLevel" NOT NULL,
    "description" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RequirementDependency_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RequirementItemChange" (
    "id" TEXT NOT NULL, "requirementSetId" TEXT NOT NULL, "requirementItemId" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL, "changeType" TEXT NOT NULL, "previousValue" JSONB,
    "nextValue" JSONB, "reason" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RequirementItemChange_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RequirementSet_eventId_version_key" ON "RequirementSet"("eventId", "version");
CREATE INDEX "RequirementSet_organizationId_idx" ON "RequirementSet"("organizationId");
CREATE INDEX "RequirementSet_eventDesignVersionId_idx" ON "RequirementSet"("eventDesignVersionId");
CREATE INDEX "RequirementSet_createdByUserId_idx" ON "RequirementSet"("createdByUserId");
CREATE INDEX "RequirementSet_approvedByUserId_idx" ON "RequirementSet"("approvedByUserId");
CREATE INDEX "RequirementSet_eventId_status_idx" ON "RequirementSet"("eventId", "status");
CREATE UNIQUE INDEX "RequirementItem_requirementSetId_requirementCode_key" ON "RequirementItem"("requirementSetId", "requirementCode");
CREATE INDEX "RequirementItem_requirementSetId_category_idx" ON "RequirementItem"("requirementSetId", "category");
CREATE INDEX "RequirementItem_requirementSetId_status_idx" ON "RequirementItem"("requirementSetId", "status");
CREATE UNIQUE INDEX "RequirementDependency_requirementSetId_sourceRequirementItemId_targetRequirementItemId_key" ON "RequirementDependency"("requirementSetId", "sourceRequirementItemId", "targetRequirementItemId");
CREATE INDEX "RequirementDependency_sourceRequirementItemId_idx" ON "RequirementDependency"("sourceRequirementItemId");
CREATE INDEX "RequirementDependency_targetRequirementItemId_idx" ON "RequirementDependency"("targetRequirementItemId");
CREATE INDEX "RequirementItemChange_requirementSetId_idx" ON "RequirementItemChange"("requirementSetId");
CREATE INDEX "RequirementItemChange_requirementItemId_idx" ON "RequirementItemChange"("requirementItemId");
CREATE INDEX "RequirementItemChange_changedByUserId_idx" ON "RequirementItemChange"("changedByUserId");

ALTER TABLE "RequirementSet" ADD CONSTRAINT "RequirementSet_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RequirementSet" ADD CONSTRAINT "RequirementSet_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RequirementSet" ADD CONSTRAINT "RequirementSet_eventDesignVersionId_fkey" FOREIGN KEY ("eventDesignVersionId") REFERENCES "EventDesignVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RequirementSet" ADD CONSTRAINT "RequirementSet_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RequirementSet" ADD CONSTRAINT "RequirementSet_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RequirementItem" ADD CONSTRAINT "RequirementItem_requirementSetId_fkey" FOREIGN KEY ("requirementSetId") REFERENCES "RequirementSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RequirementDependency" ADD CONSTRAINT "RequirementDependency_requirementSetId_fkey" FOREIGN KEY ("requirementSetId") REFERENCES "RequirementSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RequirementDependency" ADD CONSTRAINT "RequirementDependency_sourceRequirementItemId_fkey" FOREIGN KEY ("sourceRequirementItemId") REFERENCES "RequirementItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RequirementDependency" ADD CONSTRAINT "RequirementDependency_targetRequirementItemId_fkey" FOREIGN KEY ("targetRequirementItemId") REFERENCES "RequirementItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RequirementItemChange" ADD CONSTRAINT "RequirementItemChange_requirementSetId_fkey" FOREIGN KEY ("requirementSetId") REFERENCES "RequirementSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RequirementItemChange" ADD CONSTRAINT "RequirementItemChange_requirementItemId_fkey" FOREIGN KEY ("requirementItemId") REFERENCES "RequirementItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RequirementItemChange" ADD CONSTRAINT "RequirementItemChange_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
