-- Student dashboard: exam goals (exam, level, booked date) and the day-by-day to-do list. Additive only.
-- CreateTable
CREATE TABLE "ExamGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exam" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "examDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExamGoal_userId_exam_level_key" ON "ExamGoal"("userId", "exam", "level");

-- CreateIndex
CREATE INDEX "StudyTask_userId_day_idx" ON "StudyTask"("userId", "day");

-- CreateIndex
CREATE INDEX "StudyTask_userId_doneAt_idx" ON "StudyTask"("userId", "doneAt");

-- AddForeignKey
ALTER TABLE "ExamGoal" ADD CONSTRAINT "ExamGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyTask" ADD CONSTRAINT "StudyTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

