CREATE TYPE "CommercialWorkspaceStatus" AS ENUM ('Draft', 'Active', 'Awarded', 'Closed');
CREATE TYPE "CommercialRfqStatus" AS ENUM ('Draft', 'Approved', 'Sent', 'Closed');
CREATE TYPE "CommercialMessageType" AS ENUM ('Rfq', 'SupplierQuestion', 'PlannerReply', 'Clarification', 'Negotiation', 'AiComment', 'SystemEvent');
CREATE TYPE "CommercialMessageAuthorRole" AS ENUM ('Planner', 'Supplier', 'Ai', 'System');

CREATE TABLE "CommercialWorkspace" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "eventId" TEXT NOT NULL,
  "procurementPackageId" TEXT NOT NULL, "procurementSolutionId" TEXT NOT NULL,
  "status" "CommercialWorkspaceStatus" NOT NULL DEFAULT 'Draft', "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommercialWorkspace_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CommercialRfq" (
  "id" TEXT NOT NULL, "commercialWorkspaceId" TEXT NOT NULL, "supplierId" TEXT NOT NULL,
  "supplierName" TEXT NOT NULL, "status" "CommercialRfqStatus" NOT NULL DEFAULT 'Draft',
  "title" TEXT NOT NULL, "eventSummary" TEXT NOT NULL, "deliveryDate" TIMESTAMP(3),
  "collectionDate" TIMESTAMP(3), "venue" TEXT, "specialNotes" TEXT,
  "submissionDeadline" TIMESTAMP(3) NOT NULL, "approvedByUserId" TEXT,
  "approvedAt" TIMESTAMP(3), "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommercialRfq_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CommercialRfqLine" (
  "id" TEXT NOT NULL, "commercialRfqId" TEXT NOT NULL, "requirementItemId" TEXT NOT NULL,
  "description" TEXT NOT NULL, "quantity" DOUBLE PRECISION NOT NULL, "unit" TEXT NOT NULL,
  "notes" TEXT, "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "CommercialRfqLine_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CommercialMessage" (
  "id" TEXT NOT NULL, "commercialWorkspaceId" TEXT NOT NULL, "supplierId" TEXT,
  "authorUserId" TEXT, "authorRole" "CommercialMessageAuthorRole" NOT NULL,
  "type" "CommercialMessageType" NOT NULL, "body" TEXT NOT NULL, "metadata" JSONB,
  "sentAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommercialMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommercialWorkspace_procurementPackageId_key" ON "CommercialWorkspace"("procurementPackageId");
CREATE INDEX "CommercialWorkspace_organizationId_idx" ON "CommercialWorkspace"("organizationId");
CREATE INDEX "CommercialWorkspace_eventId_status_idx" ON "CommercialWorkspace"("eventId", "status");
CREATE INDEX "CommercialWorkspace_procurementSolutionId_idx" ON "CommercialWorkspace"("procurementSolutionId");
CREATE INDEX "CommercialWorkspace_createdByUserId_idx" ON "CommercialWorkspace"("createdByUserId");
CREATE UNIQUE INDEX "CommercialRfq_commercialWorkspaceId_supplierId_key" ON "CommercialRfq"("commercialWorkspaceId", "supplierId");
CREATE INDEX "CommercialRfq_supplierId_idx" ON "CommercialRfq"("supplierId");
CREATE INDEX "CommercialRfq_status_idx" ON "CommercialRfq"("status");
CREATE INDEX "CommercialRfq_approvedByUserId_idx" ON "CommercialRfq"("approvedByUserId");
CREATE UNIQUE INDEX "CommercialRfqLine_commercialRfqId_requirementItemId_key" ON "CommercialRfqLine"("commercialRfqId", "requirementItemId");
CREATE INDEX "CommercialRfqLine_requirementItemId_idx" ON "CommercialRfqLine"("requirementItemId");
CREATE INDEX "CommercialMessage_commercialWorkspaceId_createdAt_idx" ON "CommercialMessage"("commercialWorkspaceId", "createdAt");
CREATE INDEX "CommercialMessage_supplierId_idx" ON "CommercialMessage"("supplierId");
CREATE INDEX "CommercialMessage_authorUserId_idx" ON "CommercialMessage"("authorUserId");
CREATE INDEX "CommercialMessage_type_idx" ON "CommercialMessage"("type");

ALTER TABLE "CommercialWorkspace" ADD CONSTRAINT "CommercialWorkspace_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialWorkspace" ADD CONSTRAINT "CommercialWorkspace_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialWorkspace" ADD CONSTRAINT "CommercialWorkspace_procurementPackageId_fkey" FOREIGN KEY ("procurementPackageId") REFERENCES "ProcurementPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommercialWorkspace" ADD CONSTRAINT "CommercialWorkspace_procurementSolutionId_fkey" FOREIGN KEY ("procurementSolutionId") REFERENCES "ProcurementSolution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommercialWorkspace" ADD CONSTRAINT "CommercialWorkspace_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommercialRfq" ADD CONSTRAINT "CommercialRfq_commercialWorkspaceId_fkey" FOREIGN KEY ("commercialWorkspaceId") REFERENCES "CommercialWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialRfq" ADD CONSTRAINT "CommercialRfq_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommercialRfqLine" ADD CONSTRAINT "CommercialRfqLine_commercialRfqId_fkey" FOREIGN KEY ("commercialRfqId") REFERENCES "CommercialRfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialRfqLine" ADD CONSTRAINT "CommercialRfqLine_requirementItemId_fkey" FOREIGN KEY ("requirementItemId") REFERENCES "RequirementItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommercialMessage" ADD CONSTRAINT "CommercialMessage_commercialWorkspaceId_fkey" FOREIGN KEY ("commercialWorkspaceId") REFERENCES "CommercialWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialMessage" ADD CONSTRAINT "CommercialMessage_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
