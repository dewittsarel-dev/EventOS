-- Marketplace publication and reservations are owned by Resource Engine.
-- Keep the legacy inventory reference nullable so existing enquiries remain intact.
ALTER TABLE "MarketplaceEnquiry" ADD COLUMN "resourceId" TEXT;
ALTER TABLE "MarketplaceEnquiry" ALTER COLUMN "inventoryItemId" DROP NOT NULL;

-- Safely link legacy enquiries where Inventory and Resource share the organization's SKU.
UPDATE "MarketplaceEnquiry" AS enquiry
SET "resourceId" = resource."id"
FROM "InventoryItem" AS item
JOIN "Resource" AS resource
  ON resource."organizationId" = item."organizationId"
 AND resource."sku" = item."sku"
WHERE enquiry."inventoryItemId" = item."id"
  AND enquiry."resourceId" IS NULL;

CREATE INDEX "MarketplaceEnquiry_resourceId_idx" ON "MarketplaceEnquiry"("resourceId");
ALTER TABLE "MarketplaceEnquiry" ADD CONSTRAINT "MarketplaceEnquiry_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
