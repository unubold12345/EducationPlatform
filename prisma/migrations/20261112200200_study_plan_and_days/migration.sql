-- Study roadmap toward an exam date, and the daily check-in behind the streak.
-- Additive: two new tables; no existing row or column changes.
CREATE TABLE "StudyPlan" (
    "userId" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "examDate" TEXT NOT NULL,
    "target" TEXT,
    "daysPerWeek" INTEGER NOT NULL,
    "minutesPerDay" INTEGER NOT NULL,
    "done" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "StudyDay" (
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyDay_pkey" PRIMARY KEY ("userId","day")
);

ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudyDay" ADD CONSTRAINT "StudyDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
