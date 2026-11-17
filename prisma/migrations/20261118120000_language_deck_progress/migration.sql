-- Study progress on the JLPT/HSK word decks; one row per graded word.
CREATE TABLE "LanguageDeckProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deck" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "box" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "wrong" INTEGER NOT NULL DEFAULT 0,
    "reviewedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LanguageDeckProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LanguageDeckProgress_userId_deck_wordId_key" ON "LanguageDeckProgress"("userId", "deck", "wordId");

CREATE INDEX "LanguageDeckProgress_userId_deck_idx" ON "LanguageDeckProgress"("userId", "deck");

ALTER TABLE "LanguageDeckProgress" ADD CONSTRAINT "LanguageDeckProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
