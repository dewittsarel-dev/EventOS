CREATE TYPE "MarketplaceEnquiryType" AS ENUM ('Product', 'Solution');

ALTER TABLE "MarketplaceEnquiry"
ADD COLUMN "enquiryType" "MarketplaceEnquiryType" NOT NULL DEFAULT 'Product',
ADD COLUMN "requestTitle" TEXT,
ADD COLUMN "serviceCategories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "eventType" TEXT,
ADD COLUMN "guestCount" INTEGER,
ADD COLUMN "budgetCents" INTEGER,
ADD COLUMN "desiredOutcomes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "scheduleNotes" TEXT,
ADD COLUMN "accessNotes" TEXT,
ADD COLUMN "attachmentUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX "MarketplaceEnquiry_enquiryType_idx" ON "MarketplaceEnquiry"("enquiryType");
