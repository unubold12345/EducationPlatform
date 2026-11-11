-- Vocabulary organization and study progress. Additive: one new table and nullable or defaulted
-- columns on "VocabularyWord"; no existing row or column changes.
CREATE TABLE "VocabularyDeck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularyDeck_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VocabularyDeck_userId_nameKey_key" ON "VocabularyDeck"("userId", "nameKey");

ALTER TABLE "VocabularyDeck" ADD CONSTRAINT "VocabularyDeck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VocabularyWord"
    ADD COLUMN "deckId" TEXT,
    ADD COLUMN "starred" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "box" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "correct" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "wrong" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "reviewedAt" TIMESTAMP(3),
    ADD COLUMN "dueAt" TIMESTAMP(3);

CREATE INDEX "VocabularyWord_userId_deckId_idx" ON "VocabularyWord"("userId", "deckId");

ALTER TABLE "VocabularyWord" ADD CONSTRAINT "VocabularyWord_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "VocabularyDeck"("id") ON DELETE SET NULL ON UPDATE CASCADE;
