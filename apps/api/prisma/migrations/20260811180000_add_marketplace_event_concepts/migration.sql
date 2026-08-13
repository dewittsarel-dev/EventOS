CREATE TYPE "MarketplaceEventConceptStatus" AS ENUM ('Developing', 'Archived');
CREATE TYPE "MarketplaceDiscoveryPath" AS ENUM ('AiAssistant', 'GuidedBuilder', 'ManualSearch');

CREATE TABLE "MarketplaceEventConcept" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "MarketplaceEventConceptStatus" NOT NULL DEFAULT 'Developing',
    "lastDiscoveryPath" "MarketplaceDiscoveryPath" NOT NULL DEFAULT 'ManualSearch',
    "assistantBrief" TEXT,
    "eventType" TEXT,
    "eventDate" TIMESTAMP(3),
    "guestCount" INTEGER,
    "venueStatus" TEXT,
    "venueName" TEXT,
    "city" TEXT,
    "area" TEXT,
    "travelRadiusKm" INTEGER,
    "setting" TEXT,
    "theme" TEXT,
    "style" TEXT,
    "colours" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "budgetCents" INTEGER,
    "allowSubstitutions" BOOLEAN NOT NULL DEFAULT true,
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "searchTerms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketplaceEventConcept_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceEventConceptSelection" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "discoveryPath" "MarketplaceDiscoveryPath" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketplaceEventConceptSelection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketplaceEventConcept_customerId_status_updatedAt_idx" ON "MarketplaceEventConcept"("customerId", "status", "updatedAt");
CREATE UNIQUE INDEX "MarketplaceEventConceptSelection_conceptId_resourceId_key" ON "MarketplaceEventConceptSelection"("conceptId", "resourceId");
CREATE INDEX "MarketplaceEventConceptSelection_conceptId_createdAt_idx" ON "MarketplaceEventConceptSelection"("conceptId", "createdAt");
CREATE INDEX "MarketplaceEventConceptSelection_resourceId_idx" ON "MarketplaceEventConceptSelection"("resourceId");

ALTER TABLE "MarketplaceEventConcept" ADD CONSTRAINT "MarketplaceEventConcept_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "MarketplaceCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceEventConceptSelection" ADD CONSTRAINT "MarketplaceEventConceptSelection_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "MarketplaceEventConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceEventConceptSelection" ADD CONSTRAINT "MarketplaceEventConceptSelection_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
