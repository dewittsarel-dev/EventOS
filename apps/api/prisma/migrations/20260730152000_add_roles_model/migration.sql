CREATE TABLE "Role" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "permissions" TEXT NOT NULL,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Role_organizationId_name_key" ON "Role"("organizationId", "name");
CREATE INDEX "Role_organizationId_idx" ON "Role"("organizationId");
CREATE INDEX "Role_isSystem_idx" ON "Role"("isSystem");

ALTER TABLE "Role"
ADD CONSTRAINT "Role_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
