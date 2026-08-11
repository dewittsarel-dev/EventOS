CREATE TYPE "SupplierCatalogueImportStatus" AS ENUM ('Review', 'Completed', 'Cancelled');

CREATE TABLE "SupplierCatalogueImport" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "sourceFiles" JSONB NOT NULL,
    "candidates" JSONB NOT NULL,
    "extractionAdapter" TEXT,
    "status" "SupplierCatalogueImportStatus" NOT NULL DEFAULT 'Review',
    "createdById" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SupplierCatalogueImport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupplierCatalogueImport_organizationId_idx" ON "SupplierCatalogueImport"("organizationId");
CREATE INDEX "SupplierCatalogueImport_supplierId_idx" ON "SupplierCatalogueImport"("supplierId");
CREATE INDEX "SupplierCatalogueImport_status_idx" ON "SupplierCatalogueImport"("status");
ALTER TABLE "SupplierCatalogueImport" ADD CONSTRAINT "SupplierCatalogueImport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupplierCatalogueImport" ADD CONSTRAINT "SupplierCatalogueImport_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
