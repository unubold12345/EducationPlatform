-- Reading Lab practices and sample progress move from browser storage to the account.
-- Additive: two new tables; no existing row or column changes.
CREATE TABLE "ReadingPractice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceKind" TEXT NOT NULL,
    "paragraphs" JSONB NOT NULL,
    "questions" JSONB NOT NULL,
    "state" JSONB,
    "importKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingPractice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReadingSampleState" (
    "userId" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingSampleState_pkey" PRIMARY KEY ("userId","sampleId")
);

CREATE INDEX "ReadingPractice_userId_updatedAt_idx" ON "ReadingPractice"("userId", "updatedAt");

CREATE UNIQUE INDEX "ReadingPractice_userId_importKey_key" ON "ReadingPractice"("userId", "importKey");

ALTER TABLE "ReadingPractice" ADD CONSTRAINT "ReadingPractice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReadingSampleState" ADD CONSTRAINT "ReadingSampleState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
