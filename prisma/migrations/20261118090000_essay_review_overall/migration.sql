-- The overall band as its own column, so listing a student's reviews never reads the review JSON (about 15 KB each).
ALTER TABLE "EssayReview" ADD COLUMN "overall" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Existing rows take the band already stored in their review.
UPDATE "EssayReview"
SET "overall" = ("review"->>'overall')::double precision
WHERE jsonb_typeof("review"->'overall') = 'number';
