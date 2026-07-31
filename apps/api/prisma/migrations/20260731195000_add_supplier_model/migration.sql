-- CreateEnum
CREATE TYPE "SupplierCategory" AS ENUM (
  'Venue',
  'Catering',
  'Decor',
  'Photography',
  'Videography',
  'Entertainment',
  'DJ',
  'Florist',
  'AudioVisual',
  'EquipmentRental',
  'Security',
  'Transport',
  'Staffing',
  'Accommodation',
  'Printing',
  'Other'
);

-- CreateTable
CREATE TABLE "Supplier" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "category" "SupplierCategory" NOT NULL,
  "primaryContactName" TEXT,
  "phone" TEXT,
  "mobile" TEXT,
  "email" TEXT,
  "website" TEXT,
  "physicalAddress" TEXT,
  "city" TEXT,
  "province" TEXT,
  "postalCode" TEXT,
  "vatNumber" TEXT,
  "registrationNumber" TEXT,
  "preferredSupplier" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "preferredPaymentTerms" TEXT,
  "internalRating" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierEvent" (
  "id" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SupplierEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierQuotation" (
  "id" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "quotationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SupplierQuotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierTask" (
  "id" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SupplierTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Supplier_organizationId_idx" ON "Supplier"("organizationId");

-- CreateIndex
CREATE INDEX "Supplier_companyName_idx" ON "Supplier"("companyName");

-- CreateIndex
CREATE INDEX "Supplier_category_idx" ON "Supplier"("category");

-- CreateIndex
CREATE INDEX "Supplier_preferredSupplier_idx" ON "Supplier"("preferredSupplier");

-- CreateIndex
CREATE INDEX "Supplier_active_idx" ON "Supplier"("active");

-- CreateIndex
CREATE INDEX "Supplier_internalRating_idx" ON "Supplier"("internalRating");

-- CreateIndex
CREATE INDEX "SupplierEvent_supplierId_idx" ON "SupplierEvent"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierEvent_eventId_idx" ON "SupplierEvent"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierEvent_supplierId_eventId_key" ON "SupplierEvent"("supplierId", "eventId");

-- CreateIndex
CREATE INDEX "SupplierQuotation_supplierId_idx" ON "SupplierQuotation"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierQuotation_quotationId_idx" ON "SupplierQuotation"("quotationId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierQuotation_supplierId_quotationId_key" ON "SupplierQuotation"("supplierId", "quotationId");

-- CreateIndex
CREATE INDEX "SupplierTask_supplierId_idx" ON "SupplierTask"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierTask_taskId_idx" ON "SupplierTask"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierTask_supplierId_taskId_key" ON "SupplierTask"("supplierId", "taskId");

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierEvent" ADD CONSTRAINT "SupplierEvent_supplierId_fkey"
FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierEvent" ADD CONSTRAINT "SupplierEvent_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierQuotation" ADD CONSTRAINT "SupplierQuotation_supplierId_fkey"
FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierQuotation" ADD CONSTRAINT "SupplierQuotation_quotationId_fkey"
FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierTask" ADD CONSTRAINT "SupplierTask_supplierId_fkey"
FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierTask" ADD CONSTRAINT "SupplierTask_taskId_fkey"
FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
