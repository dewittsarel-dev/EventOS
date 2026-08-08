-- CreateEnum
CREATE TYPE "EventDesignStatus" AS ENUM ('Draft', 'Approved');

-- CreateTable
CREATE TABLE "ClientBriefVersion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "clientName" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventDates" TIMESTAMP(3)[],
    "venue" TEXT,
    "expectedGuests" INTEGER,
    "budgetCents" INTEGER,
    "dressCode" TEXT,
    "eventType" TEXT NOT NULL,
    "clientObjectives" TEXT,
    "initialRequirements" TEXT,
    "notes" TEXT,
    "attachments" JSONB,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientBriefVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventDesignVersion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "clientBriefVersionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "EventDesignStatus" NOT NULL DEFAULT 'Draft',
    "seating" JSONB,
    "decor" JSONB,
    "catering" JSONB,
    "entertainment" JSONB,
    "lightingAndAv" JSONB,
    "branding" JSONB,
    "infrastructure" JSONB,
    "staffing" JSONB,
    "createdByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventDesignVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClientBriefVersion_eventId_version_key" ON "ClientBriefVersion"("eventId", "version");
CREATE INDEX "ClientBriefVersion_organizationId_idx" ON "ClientBriefVersion"("organizationId");
CREATE INDEX "ClientBriefVersion_createdByUserId_idx" ON "ClientBriefVersion"("createdByUserId");
CREATE UNIQUE INDEX "EventDesignVersion_eventId_version_key" ON "EventDesignVersion"("eventId", "version");
CREATE INDEX "EventDesignVersion_organizationId_idx" ON "EventDesignVersion"("organizationId");
CREATE INDEX "EventDesignVersion_clientBriefVersionId_idx" ON "EventDesignVersion"("clientBriefVersionId");
CREATE INDEX "EventDesignVersion_createdByUserId_idx" ON "EventDesignVersion"("createdByUserId");
CREATE INDEX "EventDesignVersion_approvedByUserId_idx" ON "EventDesignVersion"("approvedByUserId");
CREATE INDEX "EventDesignVersion_eventId_status_idx" ON "EventDesignVersion"("eventId", "status");

ALTER TABLE "ClientBriefVersion" ADD CONSTRAINT "ClientBriefVersion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientBriefVersion" ADD CONSTRAINT "ClientBriefVersion_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientBriefVersion" ADD CONSTRAINT "ClientBriefVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventDesignVersion" ADD CONSTRAINT "EventDesignVersion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventDesignVersion" ADD CONSTRAINT "EventDesignVersion_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventDesignVersion" ADD CONSTRAINT "EventDesignVersion_clientBriefVersionId_fkey" FOREIGN KEY ("clientBriefVersionId") REFERENCES "ClientBriefVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventDesignVersion" ADD CONSTRAINT "EventDesignVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventDesignVersion" ADD CONSTRAINT "EventDesignVersion_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
