-- Essay Studio reviews come in two kinds: "strong" (DeepSeek, credits) and "expert" (Claude Opus, plan quota).
-- Every existing row is a Claude review.
ALTER TABLE "EssayReview" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'expert';
