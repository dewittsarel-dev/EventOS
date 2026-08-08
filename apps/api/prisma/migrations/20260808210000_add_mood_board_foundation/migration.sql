CREATE TYPE "MoodBoardStatus" AS ENUM ('Draft', 'InClientReview', 'ChangesRequested', 'Approved');
CREATE TYPE "MoodBoardObjectSource" AS ENUM ('Marketplace', 'PlannerLibrary', 'ClientUpload', 'AiConcept');
CREATE TYPE "MoodBoardReviewType" AS ENUM ('Comment', 'ChangeRequest', 'Approval');

CREATE TABLE "MoodBoard" (
    "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "eventId" TEXT NOT NULL,
    "eventDesignVersionId" TEXT NOT NULL, "requirementSetId" TEXT NOT NULL, "basedOnMoodBoardId" TEXT,
    "version" INTEGER NOT NULL, "title" TEXT NOT NULL, "status" "MoodBoardStatus" NOT NULL DEFAULT 'Draft',
    "createdByUserId" TEXT NOT NULL, "submittedAt" TIMESTAMP(3), "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MoodBoard_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MoodBoardScene" (
    "id" TEXT NOT NULL, "moodBoardId" TEXT NOT NULL, "sceneKey" TEXT NOT NULL,
    "name" TEXT NOT NULL, "description" TEXT, "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MoodBoardScene_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MoodBoardObject" (
    "id" TEXT NOT NULL, "moodBoardSceneId" TEXT NOT NULL, "requirementItemId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL, "name" TEXT NOT NULL, "source" "MoodBoardObjectSource" NOT NULL,
    "sourceReferenceId" TEXT NOT NULL, "supplierName" TEXT, "marketplaceListingId" TEXT,
    "imageUrl" TEXT NOT NULL, "locked" BOOLEAN NOT NULL DEFAULT false, "presentation" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MoodBoardObject_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MoodBoardReview" (
    "id" TEXT NOT NULL, "moodBoardId" TEXT NOT NULL, "reviewerUserId" TEXT NOT NULL,
    "type" "MoodBoardReviewType" NOT NULL, "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MoodBoardReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MoodBoard_eventId_version_key" ON "MoodBoard"("eventId", "version");
CREATE INDEX "MoodBoard_organizationId_idx" ON "MoodBoard"("organizationId");
CREATE INDEX "MoodBoard_eventDesignVersionId_idx" ON "MoodBoard"("eventDesignVersionId");
CREATE INDEX "MoodBoard_requirementSetId_idx" ON "MoodBoard"("requirementSetId");
CREATE INDEX "MoodBoard_basedOnMoodBoardId_idx" ON "MoodBoard"("basedOnMoodBoardId");
CREATE INDEX "MoodBoard_createdByUserId_idx" ON "MoodBoard"("createdByUserId");
CREATE INDEX "MoodBoard_approvedByUserId_idx" ON "MoodBoard"("approvedByUserId");
CREATE INDEX "MoodBoard_eventId_status_idx" ON "MoodBoard"("eventId", "status");
CREATE UNIQUE INDEX "MoodBoardScene_moodBoardId_sceneKey_key" ON "MoodBoardScene"("moodBoardId", "sceneKey");
CREATE INDEX "MoodBoardScene_moodBoardId_sortOrder_idx" ON "MoodBoardScene"("moodBoardId", "sortOrder");
CREATE UNIQUE INDEX "MoodBoardObject_moodBoardSceneId_objectKey_key" ON "MoodBoardObject"("moodBoardSceneId", "objectKey");
CREATE INDEX "MoodBoardObject_requirementItemId_idx" ON "MoodBoardObject"("requirementItemId");
CREATE INDEX "MoodBoardObject_source_sourceReferenceId_idx" ON "MoodBoardObject"("source", "sourceReferenceId");
CREATE INDEX "MoodBoardReview_moodBoardId_createdAt_idx" ON "MoodBoardReview"("moodBoardId", "createdAt");
CREATE INDEX "MoodBoardReview_reviewerUserId_idx" ON "MoodBoardReview"("reviewerUserId");

ALTER TABLE "MoodBoard" ADD CONSTRAINT "MoodBoard_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MoodBoard" ADD CONSTRAINT "MoodBoard_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MoodBoard" ADD CONSTRAINT "MoodBoard_eventDesignVersionId_fkey" FOREIGN KEY ("eventDesignVersionId") REFERENCES "EventDesignVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MoodBoard" ADD CONSTRAINT "MoodBoard_requirementSetId_fkey" FOREIGN KEY ("requirementSetId") REFERENCES "RequirementSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MoodBoard" ADD CONSTRAINT "MoodBoard_basedOnMoodBoardId_fkey" FOREIGN KEY ("basedOnMoodBoardId") REFERENCES "MoodBoard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MoodBoard" ADD CONSTRAINT "MoodBoard_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MoodBoard" ADD CONSTRAINT "MoodBoard_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MoodBoardScene" ADD CONSTRAINT "MoodBoardScene_moodBoardId_fkey" FOREIGN KEY ("moodBoardId") REFERENCES "MoodBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MoodBoardObject" ADD CONSTRAINT "MoodBoardObject_moodBoardSceneId_fkey" FOREIGN KEY ("moodBoardSceneId") REFERENCES "MoodBoardScene"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MoodBoardObject" ADD CONSTRAINT "MoodBoardObject_requirementItemId_fkey" FOREIGN KEY ("requirementItemId") REFERENCES "RequirementItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MoodBoardReview" ADD CONSTRAINT "MoodBoardReview_moodBoardId_fkey" FOREIGN KEY ("moodBoardId") REFERENCES "MoodBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MoodBoardReview" ADD CONSTRAINT "MoodBoardReview_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
