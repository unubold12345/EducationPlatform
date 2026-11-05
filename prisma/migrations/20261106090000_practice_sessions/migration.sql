-- Untimed practice on a mock or official paper. Additive: no existing table or row changes.
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "responses" JSONB NOT NULL DEFAULT '{}',
    "flags" JSONB NOT NULL DEFAULT '[]',
    "results" JSONB NOT NULL DEFAULT '{}',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PracticeSession_userId_slug_key" ON "PracticeSession"("userId", "slug");

CREATE INDEX "PracticeSession_userId_updatedAt_idx" ON "PracticeSession"("userId", "updatedAt");

ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
