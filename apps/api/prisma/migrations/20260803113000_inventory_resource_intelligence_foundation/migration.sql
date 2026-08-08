-- CreateEnum
CREATE TYPE "InventoryResourceStatus" AS ENUM (
  'Active',
  'Maintenance',
  'Damaged',
  'Retired',
  'Archived'
);

-- CreateEnum
CREATE TYPE "InventoryIndoorOutdoor" AS ENUM (
  'Indoor',
  'Outdoor',
  'Both'
);

-- CreateEnum
CREATE TYPE "InventoryMarketplaceVisibility" AS ENUM (
  'Private',
  'Public'
);

-- AlterTable
ALTER TABLE "InventoryItem"
ADD COLUMN "publicName" TEXT,
ADD COLUMN "internalName" TEXT,
ADD COLUMN "qrCode" TEXT,
ADD COLUMN "shortDescription" TEXT,
ADD COLUMN "longDescription" TEXT,
ADD COLUMN "internalNotes" TEXT,
ADD COLUMN "aiSummary" TEXT,
ADD COLUMN "aiKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
ADD COLUMN "aiTags" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
ADD COLUMN "aiConfidence" DOUBLE PRECISION,
ADD COLUMN "subCategory" TEXT,
ADD COLUMN "brand" TEXT,
ADD COLUMN "resourceStatus" "InventoryResourceStatus" NOT NULL DEFAULT 'Active',
ADD COLUMN "style" TEXT,
ADD COLUMN "colour" TEXT,
ADD COLUMN "material" TEXT,
ADD COLUMN "dimensions" TEXT,
ADD COLUMN "weight" TEXT,
ADD COLUMN "capacity" TEXT,
ADD COLUMN "indoorOutdoor" "InventoryIndoorOutdoor" NOT NULL DEFAULT 'Both',
ADD COLUMN "suitableEventTypes" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
ADD COLUMN "manualTags" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
ADD COLUMN "aiGeneratedTags" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
ADD COLUMN "marketplaceVisibility" "InventoryMarketplaceVisibility" NOT NULL DEFAULT 'Private',
ADD COLUMN "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL;

-- CreateIndex
CREATE INDEX "InventoryItem_resourceStatus_idx" ON "InventoryItem"("resourceStatus");

-- CreateIndex
CREATE INDEX "InventoryItem_style_idx" ON "InventoryItem"("style");

-- CreateIndex
CREATE INDEX "InventoryItem_material_idx" ON "InventoryItem"("material");

-- CreateIndex
CREATE INDEX "InventoryItem_colour_idx" ON "InventoryItem"("colour");

-- CreateIndex
CREATE INDEX "InventoryItem_marketplaceVisibility_idx" ON "InventoryItem"("marketplaceVisibility");
