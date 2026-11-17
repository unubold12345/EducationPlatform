-- Essay Studio expert reviews by Claude Opus, kept on the account (they are also the plan quota count).
-- Additive: one new table; no existing row or column changes.
CREATE TABLE "EssayReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "promptId" TEXT,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "essay" TEXT NOT NULL,
    "words" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "review" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EssayReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EssayReview_userId_createdAt_idx" ON "EssayReview"("userId", "createdAt");

ALTER TABLE "EssayReview" ADD CONSTRAINT "EssayReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
