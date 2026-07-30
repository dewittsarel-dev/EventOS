-- Align task priority values with product contract
ALTER TYPE "TaskPriority" RENAME VALUE 'Normal' TO 'Medium';
ALTER TYPE "TaskPriority" RENAME VALUE 'Urgent' TO 'Critical';

-- Update task ownership and assignment fields
ALTER TABLE "Task" DROP CONSTRAINT "Task_eventId_fkey";
ALTER TABLE "Task" DROP CONSTRAINT "Task_assignedContactId_fkey";

ALTER TABLE "Task" RENAME COLUMN "assignedContactId" TO "assignedUserId";
ALTER TABLE "Task" ADD COLUMN "createdByUserId" TEXT;

UPDATE "Task" AS t
SET "createdByUserId" = COALESCE(
  (
    SELECT m."userId"
    FROM "Membership" AS m
    WHERE m."organizationId" = t."organizationId"
    ORDER BY m."createdAt" ASC
    LIMIT 1
  ),
  (
    SELECT u."id"
    FROM "User" AS u
    ORDER BY u."createdAt" ASC
    LIMIT 1
  )
);

ALTER TABLE "Task" ALTER COLUMN "createdByUserId" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "eventId" DROP NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "dueDate" DROP NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "priority" SET DEFAULT 'Medium';

DROP INDEX IF EXISTS "Task_assignedContactId_idx";
CREATE INDEX "Task_assignedUserId_idx" ON "Task"("assignedUserId");
CREATE INDEX "Task_createdByUserId_idx" ON "Task"("createdByUserId");

ALTER TABLE "Task"
ADD CONSTRAINT "Task_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Task"
ADD CONSTRAINT "Task_assignedUserId_fkey"
FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Task"
ADD CONSTRAINT "Task_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
