-- CreateEnum
CREATE TYPE "EventResourceAllocationStatus" AS ENUM (
  'Reserved',
  'Picked',
  'InTransit',
  'OnSite',
  'Returning',
  'Returned',
  'Damaged',
  'Lost',
  'Cancelled'
);

-- CreateEnum
CREATE TYPE "EventResourceOutstandingStatus" AS ENUM (
  'Open',
  'Fulfilled',
  'Cancelled'
);

-- CreateTable
CREATE TABLE "EventResourceAllocation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "resourceReservationId" TEXT,
  "quantityRequested" DOUBLE PRECISION NOT NULL,
  "quantityReserved" DOUBLE PRECISION NOT NULL,
  "quantityReturned" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "quantityDamaged" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "quantityLost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reservedDate" TIMESTAMP(3) NOT NULL,
  "expectedReturnDate" TIMESTAMP(3),
  "actualReturnDate" TIMESTAMP(3),
  "status" "EventResourceAllocationStatus" NOT NULL DEFAULT 'Reserved',
  "createdByUserId" TEXT NOT NULL,
  "updatedByUserId" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EventResourceAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventResourceOutstanding" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "allocationId" TEXT,
  "requestedQuantity" DOUBLE PRECISION NOT NULL,
  "reservedQuantity" DOUBLE PRECISION NOT NULL,
  "outstandingQuantity" DOUBLE PRECISION NOT NULL,
  "status" "EventResourceOutstandingStatus" NOT NULL DEFAULT 'Open',
  "createdByUserId" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EventResourceOutstanding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventResourceAllocation_resourceReservationId_key" ON "EventResourceAllocation"("resourceReservationId");

-- CreateIndex
CREATE INDEX "EventResourceAllocation_organizationId_idx" ON "EventResourceAllocation"("organizationId");

-- CreateIndex
CREATE INDEX "EventResourceAllocation_eventId_idx" ON "EventResourceAllocation"("eventId");

-- CreateIndex
CREATE INDEX "EventResourceAllocation_resourceId_idx" ON "EventResourceAllocation"("resourceId");

-- CreateIndex
CREATE INDEX "EventResourceAllocation_status_idx" ON "EventResourceAllocation"("status");

-- CreateIndex
CREATE INDEX "EventResourceAllocation_reservedDate_idx" ON "EventResourceAllocation"("reservedDate");

-- CreateIndex
CREATE INDEX "EventResourceOutstanding_organizationId_idx" ON "EventResourceOutstanding"("organizationId");

-- CreateIndex
CREATE INDEX "EventResourceOutstanding_eventId_idx" ON "EventResourceOutstanding"("eventId");

-- CreateIndex
CREATE INDEX "EventResourceOutstanding_resourceId_idx" ON "EventResourceOutstanding"("resourceId");

-- CreateIndex
CREATE INDEX "EventResourceOutstanding_status_idx" ON "EventResourceOutstanding"("status");

-- AddForeignKey
ALTER TABLE "EventResourceAllocation" ADD CONSTRAINT "EventResourceAllocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventResourceAllocation" ADD CONSTRAINT "EventResourceAllocation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventResourceAllocation" ADD CONSTRAINT "EventResourceAllocation_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventResourceAllocation" ADD CONSTRAINT "EventResourceAllocation_resourceReservationId_fkey" FOREIGN KEY ("resourceReservationId") REFERENCES "ResourceReservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventResourceAllocation" ADD CONSTRAINT "EventResourceAllocation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventResourceAllocation" ADD CONSTRAINT "EventResourceAllocation_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventResourceOutstanding" ADD CONSTRAINT "EventResourceOutstanding_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventResourceOutstanding" ADD CONSTRAINT "EventResourceOutstanding_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventResourceOutstanding" ADD CONSTRAINT "EventResourceOutstanding_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventResourceOutstanding" ADD CONSTRAINT "EventResourceOutstanding_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "EventResourceAllocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventResourceOutstanding" ADD CONSTRAINT "EventResourceOutstanding_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
