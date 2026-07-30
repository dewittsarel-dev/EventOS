-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('Draft', 'Planned', 'Confirmed', 'Completed', 'Cancelled');

-- Drop old index
DROP INDEX IF EXISTS "Event_eventDate_idx";

-- AlterTable
ALTER TABLE "Event"
ADD COLUMN "startDateTime" TIMESTAMP(3),
ADD COLUMN "endDateTime" TIMESTAMP(3),
ADD COLUMN "location" TEXT,
ADD COLUMN "statusNew" "EventStatus";

-- Backfill from previous schema shape
UPDATE "Event"
SET "startDateTime" = "eventDate",
    "endDateTime" = "eventDate",
    "statusNew" = 'Draft';

-- Enforce not-null and replace old columns
ALTER TABLE "Event"
ALTER COLUMN "startDateTime" SET NOT NULL,
ALTER COLUMN "endDateTime" SET NOT NULL;

ALTER TABLE "Event"
DROP COLUMN "eventDate",
DROP COLUMN "status";

ALTER TABLE "Event"
RENAME COLUMN "statusNew" TO "status";

ALTER TABLE "Event"
ALTER COLUMN "status" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Event_startDateTime_idx" ON "Event"("startDateTime");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Event_title_idx" ON "Event"("title");
