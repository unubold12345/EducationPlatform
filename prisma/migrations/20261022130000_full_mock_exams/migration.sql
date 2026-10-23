CREATE TABLE "MockAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "activeKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "state" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MockAttempt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MockAttempt_activeKey_key" ON "MockAttempt"("activeKey");
CREATE INDEX "MockAttempt_userId_createdAt_idx" ON "MockAttempt"("userId", "createdAt");
ALTER TABLE "MockAttempt" ADD CONSTRAINT "MockAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "MockRecording" (
    "attemptId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MockRecording_pkey" PRIMARY KEY ("attemptId", "stageId")
);
ALTER TABLE "MockRecording" ADD CONSTRAINT "MockRecording_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "MockAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
