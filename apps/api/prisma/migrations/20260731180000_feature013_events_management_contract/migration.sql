-- AlterTable
ALTER TABLE "Event"
ADD COLUMN "assignedUserId" TEXT,
ADD COLUMN "eventType" TEXT,
ADD COLUMN "eventDate" TIMESTAMP(3),
ADD COLUMN "startTime" TEXT,
ADD COLUMN "endTime" TEXT,
ADD COLUMN "venue" TEXT,
ADD COLUMN "budgetCents" INTEGER,
ADD COLUMN "notes" TEXT;

-- Backfill new required fields from existing contract
UPDATE "Event"
SET "eventType" = COALESCE(NULLIF(TRIM("title"), ''), 'General'),
    "eventDate" = "startDateTime",
    "startTime" = TO_CHAR("startDateTime", 'HH24:MI'),
    "endTime" = TO_CHAR("endDateTime", 'HH24:MI'),
    "venue" = "location",
    "notes" = "description"
WHERE "eventType" IS NULL
   OR "eventDate" IS NULL
   OR "startTime" IS NULL
   OR "endTime" IS NULL;

-- Enforce required columns after backfill
ALTER TABLE "Event"
ALTER COLUMN "eventType" SET NOT NULL,
ALTER COLUMN "eventDate" SET NOT NULL,
ALTER COLUMN "startTime" SET NOT NULL,
ALTER COLUMN "endTime" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Event_assignedUserId_idx" ON "Event"("assignedUserId");

-- CreateIndex
CREATE INDEX "Event_eventDate_idx" ON "Event"("eventDate");

-- CreateIndex
CREATE INDEX "Event_eventType_idx" ON "Event"("eventType");

-- AddForeignKey
ALTER TABLE "Event"
ADD CONSTRAINT "Event_assignedUserId_fkey"
FOREIGN KEY ("assignedUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
