-- Exams made from a student's own file move from browser storage to the account.
-- Additive: one new table; no existing row or column changes.
CREATE TABLE "MyExam" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceKind" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "suggestedSeconds" INTEGER NOT NULL,
    "draft" JSONB,
    "last" JSONB,
    "best" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "importKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MyExam_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MyExam_userId_importKey_key" ON "MyExam"("userId", "importKey");

CREATE INDEX "MyExam_userId_updatedAt_idx" ON "MyExam"("userId", "updatedAt");

ALTER TABLE "MyExam" ADD CONSTRAINT "MyExam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
