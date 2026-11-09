-- A per-student vocabulary bank. Additive: no existing table or row changes.
CREATE TABLE "VocabularyWord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "example" TEXT,
    "sourceName" TEXT,
    "termKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularyWord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VocabularyWord_userId_termKey_key" ON "VocabularyWord"("userId", "termKey");

CREATE INDEX "VocabularyWord_userId_createdAt_idx" ON "VocabularyWord"("userId", "createdAt");

ALTER TABLE "VocabularyWord" ADD CONSTRAINT "VocabularyWord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
