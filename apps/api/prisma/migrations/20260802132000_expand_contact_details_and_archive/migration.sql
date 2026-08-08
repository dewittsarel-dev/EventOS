-- AlterTable
ALTER TABLE "Contact"
ADD COLUMN "mobile" TEXT,
ADD COLUMN "companyName" TEXT,
ADD COLUMN "contactType" TEXT,
ADD COLUMN "address" TEXT,
ADD COLUMN "notes" TEXT,
ADD COLUMN "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Contact_archivedAt_idx" ON "Contact"("archivedAt");
