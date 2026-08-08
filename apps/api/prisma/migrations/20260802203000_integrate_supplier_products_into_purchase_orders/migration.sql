-- Add archive and discount support to purchase orders.
ALTER TABLE "PurchaseOrder"
ADD COLUMN "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE INDEX "PurchaseOrder_archivedAt_idx" ON "PurchaseOrder"("archivedAt");

-- Expand purchase-order line items to reference supplier products and store snapshots.
ALTER TABLE "PurchaseOrderLineItem"
ADD COLUMN "supplierProductId" TEXT,
ADD COLUMN "productNameSnapshot" TEXT,
ADD COLUMN "productSkuSnapshot" TEXT,
ADD COLUMN "productBrandSnapshot" TEXT,
ADD COLUMN "productCostSnapshot" DOUBLE PRECISION,
ADD COLUMN "productVatSnapshot" DOUBLE PRECISION,
ADD COLUMN "discountRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "lineDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Seed supplier products for legacy purchase-order lines and keep a stable join marker.
INSERT INTO "SupplierProduct" (
  "organizationId",
  "supplierId",
  "productName",
  "sku",
  "category",
  "brand",
  "description",
  "unit",
  "costPrice",
  "sellingPrice",
  "vatPercent",
  "leadTimeDays",
  "minimumOrderQuantity",
  "preferredProduct",
  "active",
  "notes",
  "createdAt",
  "updatedAt"
)
SELECT
  po."organizationId",
  po."supplierId",
  COALESCE(NULLIF(TRIM(li."description"), ''), 'Legacy purchase item'),
  NULL,
  'Other'::"SupplierProductCategory",
  NULL,
  li."description",
  'Each'::"SupplierProductUnit",
  li."unitPrice",
  NULL,
  li."taxRate",
  NULL,
  NULL,
  false,
  false,
  CONCAT('LEGACY_PO_LINE:', li."id"),
  NOW(),
  NOW()
FROM "PurchaseOrderLineItem" li
JOIN "PurchaseOrder" po ON po."id" = li."purchaseOrderId";

UPDATE "PurchaseOrderLineItem" li
SET
  "supplierProductId" = sp."id",
  "productNameSnapshot" = sp."productName",
  "productSkuSnapshot" = sp."sku",
  "productBrandSnapshot" = sp."brand",
  "productCostSnapshot" = li."unitPrice",
  "productVatSnapshot" = li."taxRate",
  "lineDiscount" = 0
FROM "PurchaseOrder" po
JOIN "SupplierProduct" sp
  ON sp."organizationId" = po."organizationId"
  AND sp."supplierId" = po."supplierId"
WHERE po."id" = li."purchaseOrderId"
  AND sp."notes" = CONCAT('LEGACY_PO_LINE:', li."id");

ALTER TABLE "PurchaseOrderLineItem"
ALTER COLUMN "supplierProductId" SET NOT NULL,
ALTER COLUMN "productNameSnapshot" SET NOT NULL,
ALTER COLUMN "productCostSnapshot" SET NOT NULL;

ALTER TABLE "PurchaseOrderLineItem"
ALTER COLUMN "inventoryItemId" DROP NOT NULL;

ALTER TABLE "PurchaseOrderLineItem"
ADD CONSTRAINT "PurchaseOrderLineItem_supplierProductId_fkey"
FOREIGN KEY ("supplierProductId") REFERENCES "SupplierProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "PurchaseOrderLineItem_purchaseOrderId_inventoryItemId_key";
CREATE UNIQUE INDEX "PurchaseOrderLineItem_purchaseOrderId_supplierProductId_key"
ON "PurchaseOrderLineItem"("purchaseOrderId", "supplierProductId");

CREATE INDEX "PurchaseOrderLineItem_supplierProductId_idx"
ON "PurchaseOrderLineItem"("supplierProductId");

ALTER TABLE "PurchaseOrderLineItem"
DROP COLUMN "description",
DROP COLUMN "supplierSku";

-- Keep legacy seeded products marked and decouple line marker from notes.
UPDATE "SupplierProduct"
SET "notes" = 'Imported from legacy purchase order line item'
WHERE "notes" LIKE 'LEGACY_PO_LINE:%';
