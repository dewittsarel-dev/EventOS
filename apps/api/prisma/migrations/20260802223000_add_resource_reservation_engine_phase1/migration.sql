-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM (
  'ASSET',
  'BULK_ITEM',
  'CONSUMABLE',
  'SERVICE',
  'STAFF',
  'VEHICLE',
  'VENUE'
);

-- CreateEnum
CREATE TYPE "ResourceQuantityMode" AS ENUM (
  'SERIALIZED',
  'QUANTITY',
  'CAPACITY',
  'UNLIMITED'
);

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM (
  'AVAILABLE',
  'RESERVED',
  'DISPATCHED',
  'MAINTENANCE',
  'DAMAGED',
  'RETIRED'
);

-- CreateEnum
CREATE TYPE "ResourceVisibility" AS ENUM (
  'PRIVATE',
  'MARKETPLACE',
  'HIDDEN'
);

-- CreateEnum
CREATE TYPE "ResourceCondition" AS ENUM (
  'UNKNOWN',
  'EXCELLENT',
  'GOOD',
  'FAIR',
  'DAMAGED',
  'RETIRED'
);

-- CreateEnum
CREATE TYPE "ResourceReservationSourceType" AS ENUM (
  'EVENT',
  'RENTAL_ORDER',
  'MARKETPLACE_BOOKING',
  'INTERNAL_JOB',
  'MAINTENANCE',
  'MANUAL_HOLD'
);

-- CreateEnum
CREATE TYPE "ResourceReservationStatus" AS ENUM (
  'DRAFT',
  'PENDING',
  'RESERVED',
  'CONFIRMED',
  'RELEASED',
  'CANCELLED',
  'EXPIRED',
  'DISPATCHED',
  'RETURNED'
);

-- CreateTable
CREATE TABLE "Resource" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL,
  "resourceType" "ResourceType" NOT NULL,
  "quantityMode" "ResourceQuantityMode" NOT NULL,
  "sku" TEXT,
  "barcode" TEXT,
  "status" "ResourceStatus" NOT NULL DEFAULT 'AVAILABLE',
  "visibility" "ResourceVisibility" NOT NULL DEFAULT 'PRIVATE',
  "unit" TEXT NOT NULL,
  "totalQuantity" DOUBLE PRECISION,
  "condition" "ResourceCondition" NOT NULL DEFAULT 'UNKNOWN',
  "locationId" TEXT,
  "purchaseValue" DOUBLE PRECISION,
  "replacementValue" DOUBLE PRECISION,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "archivedAt" TIMESTAMP(3),

  CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceReservation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "sourceType" "ResourceReservationSourceType" NOT NULL,
  "sourceId" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "startDateTime" TIMESTAMP(3) NOT NULL,
  "endDateTime" TIMESTAMP(3) NOT NULL,
  "status" "ResourceReservationStatus" NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ResourceReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Resource_organizationId_sku_key" ON "Resource"("organizationId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_organizationId_barcode_key" ON "Resource"("organizationId", "barcode");

-- CreateIndex
CREATE INDEX "Resource_organizationId_idx" ON "Resource"("organizationId");

-- CreateIndex
CREATE INDEX "Resource_resourceType_idx" ON "Resource"("resourceType");

-- CreateIndex
CREATE INDEX "Resource_quantityMode_idx" ON "Resource"("quantityMode");

-- CreateIndex
CREATE INDEX "Resource_status_idx" ON "Resource"("status");

-- CreateIndex
CREATE INDEX "Resource_visibility_idx" ON "Resource"("visibility");

-- CreateIndex
CREATE INDEX "Resource_archivedAt_idx" ON "Resource"("archivedAt");

-- CreateIndex
CREATE INDEX "Resource_locationId_idx" ON "Resource"("locationId");

-- CreateIndex
CREATE INDEX "ResourceReservation_organizationId_idx" ON "ResourceReservation"("organizationId");

-- CreateIndex
CREATE INDEX "ResourceReservation_resourceId_idx" ON "ResourceReservation"("resourceId");

-- CreateIndex
CREATE INDEX "ResourceReservation_sourceType_sourceId_idx" ON "ResourceReservation"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "ResourceReservation_status_idx" ON "ResourceReservation"("status");

-- CreateIndex
CREATE INDEX "ResourceReservation_startDateTime_endDateTime_idx" ON "ResourceReservation"("startDateTime", "endDateTime");

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "StorageLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceReservation" ADD CONSTRAINT "ResourceReservation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceReservation" ADD CONSTRAINT "ResourceReservation_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
