-- CreateEnum
CREATE TYPE "MarketplaceEnquiryStatus" AS ENUM ('New', 'Acknowledged', 'Converted', 'Closed');

-- CreateTable
CREATE TABLE "MarketplaceEnquiry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "status" "MarketplaceEnquiryStatus" NOT NULL DEFAULT 'New',
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "eventDate" TIMESTAMP(3),
    "eventLocation" TEXT,
    "quantity" DOUBLE PRECISION,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceEnquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketplaceEnquiry_organizationId_idx" ON "MarketplaceEnquiry"("organizationId");
CREATE INDEX "MarketplaceEnquiry_inventoryItemId_idx" ON "MarketplaceEnquiry"("inventoryItemId");
CREATE INDEX "MarketplaceEnquiry_status_idx" ON "MarketplaceEnquiry"("status");
CREATE INDEX "MarketplaceEnquiry_createdAt_idx" ON "MarketplaceEnquiry"("createdAt");

ALTER TABLE "MarketplaceEnquiry" ADD CONSTRAINT "MarketplaceEnquiry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceEnquiry" ADD CONSTRAINT "MarketplaceEnquiry_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
