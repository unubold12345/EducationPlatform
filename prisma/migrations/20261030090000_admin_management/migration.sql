ALTER TABLE "User" ADD COLUMN "suspendedAt" TIMESTAMP(3), ADD COLUMN "suspendedReason" TEXT;
CREATE TABLE "UserEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "UserEvent_userId_createdAt_idx" ON "UserEvent"("userId", "createdAt");
CREATE INDEX "UserEvent_ipAddress_idx" ON "UserEvent"("ipAddress");
CREATE TABLE "AdminNote" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminNote_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AdminNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "AdminNote_userId_createdAt_idx" ON "AdminNote"("userId", "createdAt");
CREATE TABLE "PlanPrice" (
  "program" TEXT NOT NULL,
  "amountMnt" INTEGER NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlanPrice_pkey" PRIMARY KEY ("program")
);
