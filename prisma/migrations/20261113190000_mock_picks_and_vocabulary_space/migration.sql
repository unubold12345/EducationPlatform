-- Гадаад хэл plan: mocks picked per plan month, and permanent vocabulary space bought with purchased credits.
-- Additive: two new tables; no existing row or column changes.
CREATE TABLE "MockPick" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "monthStart" TIMESTAMP(3) NOT NULL,
    "monthEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockPick_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VocabularyExpansion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "words" INTEGER NOT NULL,
    "credits" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VocabularyExpansion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MockPick_userId_monthEnd_idx" ON "MockPick"("userId", "monthEnd");

CREATE UNIQUE INDEX "MockPick_userId_program_monthStart_slug_key" ON "MockPick"("userId", "program", "monthStart", "slug");

CREATE INDEX "VocabularyExpansion_userId_createdAt_idx" ON "VocabularyExpansion"("userId", "createdAt");

CREATE UNIQUE INDEX "VocabularyExpansion_userId_requestId_key" ON "VocabularyExpansion"("userId", "requestId");

ALTER TABLE "MockPick" ADD CONSTRAINT "MockPick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VocabularyExpansion" ADD CONSTRAINT "VocabularyExpansion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
