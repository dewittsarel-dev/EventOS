-- CreateEnum
CREATE TYPE "SupplierProductCategory" AS ENUM (
  'Equipment',
  'Service',
  'Consumable',
  'Material',
  'Lighting',
  'AudioVisual',
  'Decor',
  'Catering',
  'Venue',
  'Transport',
  'Printing',
  'Other'
);

-- CreateEnum
CREATE TYPE "SupplierProductUnit" AS ENUM (
  'Each',
  'Box',
  'Pack',
  'Kg',
  'Litre',
  'Meter',
  'Hour',
  'Day',
  'Service',
  'Other'
);

-- CreateTable
CREATE TABLE "SupplierProduct" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "sku" TEXT,
  "category" "SupplierProductCategory" NOT NULL,
  "brand" TEXT,
  "description" TEXT,
  "unit" "SupplierProductUnit" NOT NULL,
  "costPrice" DOUBLE PRECISION NOT NULL,
  "sellingPrice" DOUBLE PRECISION,
  "vatPercent" DOUBLE PRECISION,
  "leadTimeDays" INTEGER,
  "minimumOrderQuantity" DOUBLE PRECISION,
  "preferredProduct" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SupplierProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupplierProduct_organizationId_sku_key" ON "SupplierProduct"("organizationId", "sku");

-- CreateIndex
CREATE INDEX "SupplierProduct_organizationId_idx" ON "SupplierProduct"("organizationId");

-- CreateIndex
CREATE INDEX "SupplierProduct_supplierId_idx" ON "SupplierProduct"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierProduct_productName_idx" ON "SupplierProduct"("productName");

-- CreateIndex
CREATE INDEX "SupplierProduct_category_idx" ON "SupplierProduct"("category");

-- CreateIndex
CREATE INDEX "SupplierProduct_active_idx" ON "SupplierProduct"("active");

-- CreateIndex
CREATE INDEX "SupplierProduct_preferredProduct_idx" ON "SupplierProduct"("preferredProduct");

-- AddForeignKey
ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
