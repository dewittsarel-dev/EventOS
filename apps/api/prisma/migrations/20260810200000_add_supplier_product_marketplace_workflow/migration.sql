CREATE TYPE "SupplierProductPublicationStatus" AS ENUM ('Draft', 'Review', 'Published', 'Withdrawn');
CREATE TYPE "SupplierProductAvailability" AS ENUM ('Available', 'Limited', 'Unavailable', 'MadeToOrder');

ALTER TABLE "SupplierProduct"
ADD COLUMN "subcategory" TEXT,
ADD COLUMN "attributes" JSONB,
ADD COLUMN "condition" TEXT,
ADD COLUMN "totalQuantity" DOUBLE PRECISION,
ADD COLUMN "availability" "SupplierProductAvailability" NOT NULL DEFAULT 'Available',
ADD COLUMN "deliveryAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "pickupAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "deliveryRadiusKm" DOUBLE PRECISION,
ADD COLUMN "deliveryFee" DOUBLE PRECISION,
ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "searchTerms" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "marketplaceDescription" TEXT,
ADD COLUMN "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "publicationStatus" "SupplierProductPublicationStatus" NOT NULL DEFAULT 'Draft',
ADD COLUMN "marketplaceResourceId" TEXT,
ADD COLUMN "submittedForReviewAt" TIMESTAMP(3),
ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "withdrawnAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "SupplierProduct_marketplaceResourceId_key" ON "SupplierProduct"("marketplaceResourceId");
CREATE INDEX "SupplierProduct_publicationStatus_idx" ON "SupplierProduct"("publicationStatus");
