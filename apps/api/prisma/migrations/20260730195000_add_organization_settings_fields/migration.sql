-- AlterTable
ALTER TABLE "Organization"
  ADD COLUMN "tradingName" TEXT,
  ADD COLUMN "vatNumber" TEXT,
  ADD COLUMN "registrationNumber" TEXT,
  ADD COLUMN "email" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "website" TEXT,
  ADD COLUMN "physicalAddress" TEXT,
  ADD COLUMN "postalAddress" TEXT,
  ADD COLUMN "logoUrl" TEXT;
