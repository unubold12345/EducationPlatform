CREATE TABLE "PaperAttempt" (
 "id" TEXT NOT NULL PRIMARY KEY,"userId" TEXT NOT NULL,"slug" TEXT NOT NULL,
 "activeKey" TEXT,"status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',"revision" INTEGER NOT NULL DEFAULT 0,
 "snapshot" JSONB NOT NULL,"responses" JSONB NOT NULL,"deadline" TIMESTAMP(3) NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,"finishedAt" TIMESTAMP(3),
 CONSTRAINT "PaperAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PaperAttempt_activeKey_key" ON "PaperAttempt"("activeKey");
CREATE INDEX "PaperAttempt_userId_createdAt_idx" ON "PaperAttempt"("userId","createdAt");
