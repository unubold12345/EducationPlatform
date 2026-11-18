-- AI grading of a finished mock's Writing or Speaking; one row per attempt and part.
CREATE TABLE "MockGrade" (
    "attemptId" TEXT NOT NULL,
    "part" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "tries" INTEGER NOT NULL DEFAULT 0,
    "leaseUntil" TIMESTAMP(3),
    "result" JSONB,
    "error" TEXT,
    "model" TEXT NOT NULL DEFAULT '',
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MockGrade_pkey" PRIMARY KEY ("attemptId","part")
);

ALTER TABLE "MockGrade" ADD CONSTRAINT "MockGrade_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "MockAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
