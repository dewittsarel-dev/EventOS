CREATE TYPE "CommercialQuoteStatus" AS ENUM ('Submitted', 'Superseded', 'Awarded', 'Rejected');
CREATE TYPE "CommercialSubstitutionReviewStatus" AS ENUM ('PendingReview', 'Approved', 'Rejected');
CREATE TYPE "CommercialPurchaseOrderDraftStatus" AS ENUM ('Draft', 'Approved', 'Generated');

CREATE TABLE "CommercialQuote" (
  "id" TEXT NOT NULL, "commercialWorkspaceId" TEXT NOT NULL, "commercialRfqId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL, "supplierName" TEXT NOT NULL, "version" INTEGER NOT NULL,
  "status" "CommercialQuoteStatus" NOT NULL DEFAULT 'Submitted', "currency" TEXT NOT NULL DEFAULT 'ZAR',
  "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0, "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "subtotal" DOUBLE PRECISION NOT NULL, "totalAmount" DOUBLE PRECISION NOT NULL, "paymentTerms" TEXT,
  "validUntil" TIMESTAMP(3), "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "CommercialQuote_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CommercialQuoteLine" (
  "id" TEXT NOT NULL, "commercialQuoteId" TEXT NOT NULL, "requirementItemId" TEXT NOT NULL,
  "description" TEXT NOT NULL, "offeredDescription" TEXT NOT NULL, "quantityOffered" DOUBLE PRECISION NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL, "lineTotal" DOUBLE PRECISION NOT NULL, "included" BOOLEAN NOT NULL DEFAULT false,
  "qualificationNotes" TEXT, "availabilityNotes" TEXT, "expectedDeliveryDate" TIMESTAMP(3),
  "isSubstitution" BOOLEAN NOT NULL DEFAULT false, CONSTRAINT "CommercialQuoteLine_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CommercialSubstitutionImpact" (
  "id" TEXT NOT NULL, "commercialQuoteLineId" TEXT NOT NULL, "requirementItemId" TEXT NOT NULL,
  "affectsRequirement" BOOLEAN NOT NULL DEFAULT true, "affectsMoodBoard" BOOLEAN NOT NULL DEFAULT true,
  "affectsBudget" BOOLEAN NOT NULL DEFAULT true, "status" "CommercialSubstitutionReviewStatus" NOT NULL DEFAULT 'PendingReview',
  "reviewNotes" TEXT, "reviewedByUserId" TEXT, "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "CommercialSubstitutionImpact_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CommercialAward" (
  "id" TEXT NOT NULL, "commercialWorkspaceId" TEXT NOT NULL, "commercialQuoteLineId" TEXT NOT NULL,
  "requirementItemId" TEXT NOT NULL, "supplierId" TEXT NOT NULL, "quantity" DOUBLE PRECISION NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL, "lineTotal" DOUBLE PRECISION NOT NULL, "awardedByUserId" TEXT NOT NULL,
  "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "CommercialAward_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CommercialPurchaseOrderDraft" (
  "id" TEXT NOT NULL, "commercialWorkspaceId" TEXT NOT NULL, "supplierId" TEXT NOT NULL, "supplierName" TEXT NOT NULL,
  "status" "CommercialPurchaseOrderDraftStatus" NOT NULL DEFAULT 'Draft', "currency" TEXT NOT NULL DEFAULT 'ZAR',
  "subtotal" DOUBLE PRECISION NOT NULL, "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0, "totalAmount" DOUBLE PRECISION NOT NULL,
  "paymentTerms" TEXT, "approvedByUserId" TEXT, "approvedAt" TIMESTAMP(3), "purchaseOrderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommercialPurchaseOrderDraft_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CommercialPurchaseOrderDraftLine" (
  "id" TEXT NOT NULL, "commercialPurchaseOrderDraftId" TEXT NOT NULL, "commercialAwardId" TEXT NOT NULL,
  "requirementItemId" TEXT NOT NULL, "description" TEXT NOT NULL, "quantity" DOUBLE PRECISION NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL, "lineTotal" DOUBLE PRECISION NOT NULL, "supplierProductId" TEXT,
  CONSTRAINT "CommercialPurchaseOrderDraftLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommercialQuote_commercialRfqId_version_key" ON "CommercialQuote"("commercialRfqId", "version");
CREATE INDEX "CommercialQuote_commercialWorkspaceId_status_idx" ON "CommercialQuote"("commercialWorkspaceId", "status");
CREATE INDEX "CommercialQuote_supplierId_idx" ON "CommercialQuote"("supplierId");
CREATE UNIQUE INDEX "CommercialQuoteLine_commercialQuoteId_requirementItemId_key" ON "CommercialQuoteLine"("commercialQuoteId", "requirementItemId");
CREATE INDEX "CommercialQuoteLine_requirementItemId_idx" ON "CommercialQuoteLine"("requirementItemId");
CREATE UNIQUE INDEX "CommercialSubstitutionImpact_commercialQuoteLineId_key" ON "CommercialSubstitutionImpact"("commercialQuoteLineId");
CREATE INDEX "CommercialSubstitutionImpact_requirementItemId_status_idx" ON "CommercialSubstitutionImpact"("requirementItemId", "status");
CREATE UNIQUE INDEX "CommercialAward_commercialWorkspaceId_commercialQuoteLineId_key" ON "CommercialAward"("commercialWorkspaceId", "commercialQuoteLineId");
CREATE INDEX "CommercialAward_commercialWorkspaceId_requirementItemId_idx" ON "CommercialAward"("commercialWorkspaceId", "requirementItemId");
CREATE INDEX "CommercialAward_supplierId_idx" ON "CommercialAward"("supplierId");
CREATE UNIQUE INDEX "CommercialPurchaseOrderDraft_commercialWorkspaceId_supplierId_key" ON "CommercialPurchaseOrderDraft"("commercialWorkspaceId", "supplierId");
CREATE INDEX "CommercialPurchaseOrderDraft_status_idx" ON "CommercialPurchaseOrderDraft"("status");
CREATE UNIQUE INDEX "CommercialPurchaseOrderDraftLine_commercialAwardId_key" ON "CommercialPurchaseOrderDraftLine"("commercialAwardId");
CREATE INDEX "CommercialPurchaseOrderDraftLine_commercialPurchaseOrderDraftId_idx" ON "CommercialPurchaseOrderDraftLine"("commercialPurchaseOrderDraftId");
CREATE INDEX "CommercialPurchaseOrderDraftLine_requirementItemId_idx" ON "CommercialPurchaseOrderDraftLine"("requirementItemId");

ALTER TABLE "CommercialQuote" ADD CONSTRAINT "CommercialQuote_commercialWorkspaceId_fkey" FOREIGN KEY ("commercialWorkspaceId") REFERENCES "CommercialWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialQuote" ADD CONSTRAINT "CommercialQuote_commercialRfqId_fkey" FOREIGN KEY ("commercialRfqId") REFERENCES "CommercialRfq"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommercialQuoteLine" ADD CONSTRAINT "CommercialQuoteLine_commercialQuoteId_fkey" FOREIGN KEY ("commercialQuoteId") REFERENCES "CommercialQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialSubstitutionImpact" ADD CONSTRAINT "CommercialSubstitutionImpact_commercialQuoteLineId_fkey" FOREIGN KEY ("commercialQuoteLineId") REFERENCES "CommercialQuoteLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialAward" ADD CONSTRAINT "CommercialAward_commercialWorkspaceId_fkey" FOREIGN KEY ("commercialWorkspaceId") REFERENCES "CommercialWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialAward" ADD CONSTRAINT "CommercialAward_commercialQuoteLineId_fkey" FOREIGN KEY ("commercialQuoteLineId") REFERENCES "CommercialQuoteLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommercialPurchaseOrderDraft" ADD CONSTRAINT "CommercialPurchaseOrderDraft_commercialWorkspaceId_fkey" FOREIGN KEY ("commercialWorkspaceId") REFERENCES "CommercialWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialPurchaseOrderDraftLine" ADD CONSTRAINT "CommercialPurchaseOrderDraftLine_commercialPurchaseOrderDraftId_fkey" FOREIGN KEY ("commercialPurchaseOrderDraftId") REFERENCES "CommercialPurchaseOrderDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialPurchaseOrderDraftLine" ADD CONSTRAINT "CommercialPurchaseOrderDraftLine_commercialAwardId_fkey" FOREIGN KEY ("commercialAwardId") REFERENCES "CommercialAward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
