-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('ClientMeeting', 'InternalPlanning', 'SupplierMeeting', 'SiteVisit', 'Briefing', 'Debrief', 'Other');

-- CreateEnum
CREATE TYPE "MeetingAttendeeStatus" AS ENUM ('Attended', 'Invited', 'Apology', 'Optional');

-- CreateEnum
CREATE TYPE "MeetingActionItemStatus" AS ENUM ('Open', 'InProgress', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "MeetingActionItemPriority" AS ENUM ('Low', 'Medium', 'High', 'Urgent');

-- CreateTable
CREATE TABLE "MeetingNote" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "location" TEXT,
    "meetingType" "MeetingType" NOT NULL,
    "summary" TEXT,
    "discussionNotes" TEXT,
    "decisions" TEXT,
    "nextMeetingDate" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingAttendee" (
    "id" TEXT NOT NULL,
    "meetingNoteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "roleOrOrganization" TEXT,
    "attendanceStatus" "MeetingAttendeeStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingActionItem" (
    "id" TEXT NOT NULL,
    "meetingNoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assignedUserId" TEXT,
    "assignedContactName" TEXT,
    "dueDate" TIMESTAMP(3),
    "priority" "MeetingActionItemPriority" NOT NULL,
    "status" "MeetingActionItemStatus" NOT NULL,
    "linkedTaskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeetingNote_organizationId_idx" ON "MeetingNote"("organizationId");

-- CreateIndex
CREATE INDEX "MeetingNote_eventId_idx" ON "MeetingNote"("eventId");

-- CreateIndex
CREATE INDEX "MeetingNote_meetingDate_idx" ON "MeetingNote"("meetingDate");

-- CreateIndex
CREATE INDEX "MeetingNote_meetingType_idx" ON "MeetingNote"("meetingType");

-- CreateIndex
CREATE INDEX "MeetingNote_title_idx" ON "MeetingNote"("title");

-- CreateIndex
CREATE INDEX "MeetingAttendee_meetingNoteId_idx" ON "MeetingAttendee"("meetingNoteId");

-- CreateIndex
CREATE INDEX "MeetingAttendee_email_idx" ON "MeetingAttendee"("email");

-- CreateIndex
CREATE INDEX "MeetingAttendee_attendanceStatus_idx" ON "MeetingAttendee"("attendanceStatus");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingActionItem_linkedTaskId_key" ON "MeetingActionItem"("linkedTaskId");

-- CreateIndex
CREATE INDEX "MeetingActionItem_meetingNoteId_idx" ON "MeetingActionItem"("meetingNoteId");

-- CreateIndex
CREATE INDEX "MeetingActionItem_assignedUserId_idx" ON "MeetingActionItem"("assignedUserId");

-- CreateIndex
CREATE INDEX "MeetingActionItem_dueDate_idx" ON "MeetingActionItem"("dueDate");

-- CreateIndex
CREATE INDEX "MeetingActionItem_priority_idx" ON "MeetingActionItem"("priority");

-- CreateIndex
CREATE INDEX "MeetingActionItem_status_idx" ON "MeetingActionItem"("status");

-- AddForeignKey
ALTER TABLE "MeetingNote" ADD CONSTRAINT "MeetingNote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingNote" ADD CONSTRAINT "MeetingNote_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingNote" ADD CONSTRAINT "MeetingNote_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendee" ADD CONSTRAINT "MeetingAttendee_meetingNoteId_fkey" FOREIGN KEY ("meetingNoteId") REFERENCES "MeetingNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingActionItem" ADD CONSTRAINT "MeetingActionItem_meetingNoteId_fkey" FOREIGN KEY ("meetingNoteId") REFERENCES "MeetingNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingActionItem" ADD CONSTRAINT "MeetingActionItem_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingActionItem" ADD CONSTRAINT "MeetingActionItem_linkedTaskId_fkey" FOREIGN KEY ("linkedTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
