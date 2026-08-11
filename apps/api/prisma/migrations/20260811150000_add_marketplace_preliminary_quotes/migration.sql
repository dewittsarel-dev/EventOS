CREATE TYPE "MarketplacePreliminaryQuoteStatus" AS ENUM ('Draft', 'Sent', 'Superseded', 'Withdrawn');

CREATE TABLE "MarketplacePreliminaryQuote" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "MarketplacePreliminaryQuoteStatus" NOT NULL DEFAULT 'Draft',
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "subtotalCents" INTEGER NOT NULL,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "deliveryFeeCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL,
    "paymentTerms" TEXT,
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketplacePreliminaryQuote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplacePreliminaryQuoteLine" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "lineTotalCents" INTEGER NOT NULL,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MarketplacePreliminaryQuoteLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MarketplacePreliminaryQuote_enquiryId_version_key" ON "MarketplacePreliminaryQuote"("enquiryId", "version");
CREATE INDEX "MarketplacePreliminaryQuote_organizationId_idx" ON "MarketplacePreliminaryQuote"("organizationId");
CREATE INDEX "MarketplacePreliminaryQuote_enquiryId_status_idx" ON "MarketplacePreliminaryQuote"("enquiryId", "status");
CREATE INDEX "MarketplacePreliminaryQuote_createdByUserId_idx" ON "MarketplacePreliminaryQuote"("createdByUserId");
CREATE INDEX "MarketplacePreliminaryQuoteLine_quoteId_sortOrder_idx" ON "MarketplacePreliminaryQuoteLine"("quoteId", "sortOrder");

ALTER TABLE "MarketplacePreliminaryQuote" ADD CONSTRAINT "MarketplacePreliminaryQuote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplacePreliminaryQuote" ADD CONSTRAINT "MarketplacePreliminaryQuote_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "MarketplaceEnquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplacePreliminaryQuote" ADD CONSTRAINT "MarketplacePreliminaryQuote_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplacePreliminaryQuoteLine" ADD CONSTRAINT "MarketplacePreliminaryQuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "MarketplacePreliminaryQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
