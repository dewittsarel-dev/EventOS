-- AlterTable
ALTER TABLE "InventoryItem"
ADD COLUMN "marketplaceTitle" TEXT,
ADD COLUMN "marketplaceDescription" TEXT,
ADD COLUMN "theme" TEXT,
ADD COLUMN "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
ADD COLUMN "primaryPhotoUrl" TEXT,
ADD COLUMN "photoAssets" JSONB;

-- CreateIndex
CREATE INDEX "InventoryItem_theme_idx" ON "InventoryItem"("theme");
