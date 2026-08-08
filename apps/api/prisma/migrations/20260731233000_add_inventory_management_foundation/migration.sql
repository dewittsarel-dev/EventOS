-- CreateEnum
CREATE TYPE "InventoryItemType" AS ENUM ('Equipment', 'Furniture', 'Decor', 'Consumable', 'Product', 'Service', 'Other');

-- CreateEnum
CREATE TYPE "UnitOfMeasure" AS ENUM ('Each', 'Pair', 'Set', 'Box', 'Pack', 'Metre', 'SquareMetre', 'Kilogram', 'Litre', 'Hour', 'Day', 'Other');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM (
  'OpeningBalance',
  'StockIn',
  'StockOut',
  'AdjustmentIncrease',
  'AdjustmentDecrease',
  'TransferIn',
  'TransferOut',
  'Damaged',
  'Lost',
  'Returned'
);

-- CreateTable
CREATE TABLE "InventoryCategory" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InventoryCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageLocation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "physicalAddress" TEXT,
  "city" TEXT,
  "province" TEXT,
  "notes" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "StorageLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "barcode" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "categoryId" TEXT NOT NULL,
  "preferredSupplierId" TEXT,
  "itemType" "InventoryItemType" NOT NULL,
  "unitOfMeasure" "UnitOfMeasure" NOT NULL,
  "costPrice" DOUBLE PRECISION,
  "replacementValue" DOUBLE PRECISION,
  "rentalPrice" DOUBLE PRECISION,
  "sellingPrice" DOUBLE PRECISION,
  "taxable" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "trackQuantity" BOOLEAN NOT NULL DEFAULT true,
  "trackSerialNumbers" BOOLEAN NOT NULL DEFAULT false,
  "minimumStock" DOUBLE PRECISION,
  "reorderLevel" DOUBLE PRECISION,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockLevel" (
  "inventoryItemId" TEXT NOT NULL,
  "storageLocationId" TEXT NOT NULL,
  "quantityOnHand" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "quantityReserved" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "StockLevel_pkey" PRIMARY KEY ("inventoryItemId","storageLocationId")
);

-- CreateTable
CREATE TABLE "StockMovement" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "storageLocationId" TEXT NOT NULL,
  "movementType" "StockMovementType" NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "reference" TEXT,
  "reason" TEXT,
  "notes" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryCategory_organizationId_name_key" ON "InventoryCategory"("organizationId", "name");

-- CreateIndex
CREATE INDEX "InventoryCategory_organizationId_idx" ON "InventoryCategory"("organizationId");

-- CreateIndex
CREATE INDEX "InventoryCategory_active_idx" ON "InventoryCategory"("active");

-- CreateIndex
CREATE UNIQUE INDEX "StorageLocation_organizationId_code_key" ON "StorageLocation"("organizationId", "code");

-- CreateIndex
CREATE INDEX "StorageLocation_organizationId_idx" ON "StorageLocation"("organizationId");

-- CreateIndex
CREATE INDEX "StorageLocation_active_idx" ON "StorageLocation"("active");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_organizationId_sku_key" ON "InventoryItem"("organizationId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_organizationId_barcode_key" ON "InventoryItem"("organizationId", "barcode");

-- CreateIndex
CREATE INDEX "InventoryItem_organizationId_idx" ON "InventoryItem"("organizationId");

-- CreateIndex
CREATE INDEX "InventoryItem_categoryId_idx" ON "InventoryItem"("categoryId");

-- CreateIndex
CREATE INDEX "InventoryItem_preferredSupplierId_idx" ON "InventoryItem"("preferredSupplierId");

-- CreateIndex
CREATE INDEX "InventoryItem_itemType_idx" ON "InventoryItem"("itemType");

-- CreateIndex
CREATE INDEX "InventoryItem_active_idx" ON "InventoryItem"("active");

-- CreateIndex
CREATE INDEX "InventoryItem_name_idx" ON "InventoryItem"("name");

-- CreateIndex
CREATE INDEX "StockLevel_storageLocationId_idx" ON "StockLevel"("storageLocationId");

-- CreateIndex
CREATE INDEX "StockMovement_organizationId_idx" ON "StockMovement"("organizationId");

-- CreateIndex
CREATE INDEX "StockMovement_inventoryItemId_idx" ON "StockMovement"("inventoryItemId");

-- CreateIndex
CREATE INDEX "StockMovement_storageLocationId_idx" ON "StockMovement"("storageLocationId");

-- CreateIndex
CREATE INDEX "StockMovement_movementType_idx" ON "StockMovement"("movementType");

-- CreateIndex
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

-- AddForeignKey
ALTER TABLE "InventoryCategory" ADD CONSTRAINT "InventoryCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageLocation" ADD CONSTRAINT "StorageLocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "InventoryCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_preferredSupplierId_fkey" FOREIGN KEY ("preferredSupplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_storageLocationId_fkey" FOREIGN KEY ("storageLocationId") REFERENCES "StorageLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_storageLocationId_fkey" FOREIGN KEY ("storageLocationId") REFERENCES "StorageLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_deliveryLocationId_fkey" FOREIGN KEY ("deliveryLocationId") REFERENCES "StorageLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLineItem" ADD CONSTRAINT "PurchaseOrderLineItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_storageLocationId_fkey" FOREIGN KEY ("storageLocationId") REFERENCES "StorageLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
