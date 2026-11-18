-- A detailed review of an essay from a finished mock: the attempt and the question it answers.
ALTER TABLE "EssayReview" ADD COLUMN "attemptId" TEXT,
ADD COLUMN "questionId" TEXT;

CREATE INDEX "EssayReview_attemptId_idx" ON "EssayReview"("attemptId");
