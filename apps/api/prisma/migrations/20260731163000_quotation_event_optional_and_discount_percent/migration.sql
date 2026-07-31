ALTER TYPE "QuotationStatus" ADD VALUE IF NOT EXISTS 'Cancelled';

ALTER TABLE "Quotation"
ALTER COLUMN "eventId" DROP NOT NULL;

ALTER TABLE "Quotation"
DROP CONSTRAINT IF EXISTS "Quotation_eventId_fkey";

ALTER TABLE "Quotation"
ADD CONSTRAINT "Quotation_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QuotationItem"
ADD COLUMN "discountPercent" INTEGER NOT NULL DEFAULT 0;
