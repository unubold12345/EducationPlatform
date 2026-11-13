-- AI-written structure of a study roadmap (phases, weekly themes, study routines).
-- Additive: one nullable column; no existing row changes.
ALTER TABLE "StudyPlan" ADD COLUMN "structure" JSONB;
