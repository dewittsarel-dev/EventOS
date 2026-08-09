CREATE TYPE "MoodBoardRenderStatus" AS ENUM ('Prepared', 'Submitted', 'Rendering', 'Completed', 'Failed', 'Cancelled');

CREATE TABLE "MoodBoardRenderRequest" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "moodBoardId" TEXT NOT NULL,
  "sceneId" TEXT NOT NULL,
  "status" "MoodBoardRenderStatus" NOT NULL DEFAULT 'Prepared',
  "prompt" TEXT NOT NULL,
  "inputPayload" JSONB NOT NULL,
  "provider" TEXT,
  "providerJobId" TEXT,
  "resultImageUrl" TEXT,
  "failureReason" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "submittedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MoodBoardRenderRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MoodBoardRenderRequest_organizationId_idx" ON "MoodBoardRenderRequest"("organizationId");
CREATE INDEX "MoodBoardRenderRequest_moodBoardId_createdAt_idx" ON "MoodBoardRenderRequest"("moodBoardId", "createdAt");
CREATE INDEX "MoodBoardRenderRequest_sceneId_status_idx" ON "MoodBoardRenderRequest"("sceneId", "status");
CREATE INDEX "MoodBoardRenderRequest_createdByUserId_idx" ON "MoodBoardRenderRequest"("createdByUserId");

ALTER TABLE "MoodBoardRenderRequest" ADD CONSTRAINT "MoodBoardRenderRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MoodBoardRenderRequest" ADD CONSTRAINT "MoodBoardRenderRequest_moodBoardId_fkey" FOREIGN KEY ("moodBoardId") REFERENCES "MoodBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MoodBoardRenderRequest" ADD CONSTRAINT "MoodBoardRenderRequest_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "MoodBoardScene"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MoodBoardRenderRequest" ADD CONSTRAINT "MoodBoardRenderRequest_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
