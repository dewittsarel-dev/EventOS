CREATE TYPE "MarketplaceMessageAuthorRole" AS ENUM ('Customer', 'Supplier', 'System');

CREATE TABLE "MarketplaceCustomer" (
  "id" TEXT NOT NULL, "email" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "name" TEXT NOT NULL, "phone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketplaceCustomer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MarketplaceCustomer_email_key" ON "MarketplaceCustomer"("email");

ALTER TABLE "MarketplaceEnquiry" ADD COLUMN "customerId" TEXT;
CREATE INDEX "MarketplaceEnquiry_customerId_idx" ON "MarketplaceEnquiry"("customerId");
ALTER TABLE "MarketplaceEnquiry" ADD CONSTRAINT "MarketplaceEnquiry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "MarketplaceCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "MarketplaceCustomerShortlistItem" (
  "id" TEXT NOT NULL, "customerId" TEXT NOT NULL, "resourceId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketplaceCustomerShortlistItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MarketplaceCustomerShortlistItem_customerId_resourceId_key" ON "MarketplaceCustomerShortlistItem"("customerId", "resourceId");
CREATE INDEX "MarketplaceCustomerShortlistItem_customerId_createdAt_idx" ON "MarketplaceCustomerShortlistItem"("customerId", "createdAt");
CREATE INDEX "MarketplaceCustomerShortlistItem_resourceId_idx" ON "MarketplaceCustomerShortlistItem"("resourceId");
ALTER TABLE "MarketplaceCustomerShortlistItem" ADD CONSTRAINT "MarketplaceCustomerShortlistItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "MarketplaceCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceCustomerShortlistItem" ADD CONSTRAINT "MarketplaceCustomerShortlistItem_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MarketplaceEnquiryMessage" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "enquiryId" TEXT NOT NULL, "authorRole" "MarketplaceMessageAuthorRole" NOT NULL,
  "authorCustomerId" TEXT, "authorUserId" TEXT, "body" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketplaceEnquiryMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MarketplaceEnquiryMessage_organizationId_idx" ON "MarketplaceEnquiryMessage"("organizationId");
CREATE INDEX "MarketplaceEnquiryMessage_enquiryId_createdAt_idx" ON "MarketplaceEnquiryMessage"("enquiryId", "createdAt");
CREATE INDEX "MarketplaceEnquiryMessage_authorCustomerId_idx" ON "MarketplaceEnquiryMessage"("authorCustomerId");
CREATE INDEX "MarketplaceEnquiryMessage_authorUserId_idx" ON "MarketplaceEnquiryMessage"("authorUserId");
ALTER TABLE "MarketplaceEnquiryMessage" ADD CONSTRAINT "MarketplaceEnquiryMessage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceEnquiryMessage" ADD CONSTRAINT "MarketplaceEnquiryMessage_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "MarketplaceEnquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceEnquiryMessage" ADD CONSTRAINT "MarketplaceEnquiryMessage_authorCustomerId_fkey" FOREIGN KEY ("authorCustomerId") REFERENCES "MarketplaceCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MarketplaceEnquiryMessage" ADD CONSTRAINT "MarketplaceEnquiryMessage_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
