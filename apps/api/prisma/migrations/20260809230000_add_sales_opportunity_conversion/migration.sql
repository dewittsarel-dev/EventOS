CREATE TYPE "SalesOpportunityStatus" AS ENUM ('New', 'Qualifying', 'Qualified', 'Won', 'Lost');

CREATE TABLE "SalesOpportunity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "marketplaceEnquiryId" TEXT NOT NULL,
    "contactId" TEXT,
    "eventId" TEXT,
    "status" "SalesOpportunityStatus" NOT NULL DEFAULT 'New',
    "title" TEXT NOT NULL,
    "eventType" TEXT,
    "eventDate" TIMESTAMP(3),
    "venue" TEXT,
    "estimatedValueCents" INTEGER,
    "qualificationNotes" TEXT,
    "confirmationEvidenceType" TEXT,
    "confirmationReference" TEXT,
    "confirmationRecordedAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "convertedByUserId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SalesOpportunity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SalesOpportunity_marketplaceEnquiryId_key" ON "SalesOpportunity"("marketplaceEnquiryId");
CREATE UNIQUE INDEX "SalesOpportunity_eventId_key" ON "SalesOpportunity"("eventId");
CREATE INDEX "SalesOpportunity_organizationId_idx" ON "SalesOpportunity"("organizationId");
CREATE INDEX "SalesOpportunity_status_idx" ON "SalesOpportunity"("status");
CREATE INDEX "SalesOpportunity_contactId_idx" ON "SalesOpportunity"("contactId");
CREATE INDEX "SalesOpportunity_createdAt_idx" ON "SalesOpportunity"("createdAt");

ALTER TABLE "SalesOpportunity" ADD CONSTRAINT "SalesOpportunity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalesOpportunity" ADD CONSTRAINT "SalesOpportunity_marketplaceEnquiryId_fkey" FOREIGN KEY ("marketplaceEnquiryId") REFERENCES "MarketplaceEnquiry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesOpportunity" ADD CONSTRAINT "SalesOpportunity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesOpportunity" ADD CONSTRAINT "SalesOpportunity_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
