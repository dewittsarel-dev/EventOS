-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('Todo', 'InProgress', 'Waiting', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('Low', 'Normal', 'High', 'Urgent');

-- CreateTable
CREATE TABLE "Task" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "assignedContactId" TEXT,
  "quotationId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "priority" "TaskPriority" NOT NULL DEFAULT 'Normal',
  "status" "TaskStatus" NOT NULL DEFAULT 'Todo',
  "completedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_organizationId_idx" ON "Task"("organizationId");
CREATE INDEX "Task_eventId_idx" ON "Task"("eventId");
CREATE INDEX "Task_assignedContactId_idx" ON "Task"("assignedContactId");
CREATE INDEX "Task_quotationId_idx" ON "Task"("quotationId");
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "Task_priority_idx" ON "Task"("priority");
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
CREATE INDEX "Task_archivedAt_idx" ON "Task"("archivedAt");

-- AddForeignKey
ALTER TABLE "Task"
ADD CONSTRAINT "Task_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Task"
ADD CONSTRAINT "Task_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Task"
ADD CONSTRAINT "Task_assignedContactId_fkey"
FOREIGN KEY ("assignedContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Task"
ADD CONSTRAINT "Task_quotationId_fkey"
FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
