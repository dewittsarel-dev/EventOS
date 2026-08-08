-- AlterTable
ALTER TABLE "Resource"
ADD COLUMN "supplierId" TEXT,
ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
ADD COLUMN "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
ADD COLUMN "aiSummary" TEXT,
ADD COLUMN "searchPhrases" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
ADD COLUMN "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
ADD COLUMN "rentalPrice" DOUBLE PRECISION,
ADD COLUMN "damagedQuantity" DOUBLE PRECISION DEFAULT 0 NOT NULL,
ADD COLUMN "maintenanceQuantity" DOUBLE PRECISION DEFAULT 0 NOT NULL;

-- CreateIndex
CREATE INDEX "Resource_supplierId_idx" ON "Resource"("supplierId");

-- AddForeignKey
ALTER TABLE "Resource"
ADD CONSTRAINT "Resource_supplierId_fkey"
FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
