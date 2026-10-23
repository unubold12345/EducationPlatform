import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { questions } from "../src/modules/practice/questions";
import { gradePractice } from "../src/modules/practice/grading";
import { exerciseSets } from "../src/modules/exercises/content";
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: process.env.AUTH_LOCAL_PILOT === "true" ? 1 : 2, idleTimeoutMillis: 1000 }), transactionOptions:{timeout:60000,maxWait:10000} });
try {
  await db.$transaction(async tx => {
    await tx.program.upsert({ where: { id: "sat" }, create: { id: "sat", slug: "sat", title: "SAT" }, update: {} });
    await tx.subject.upsert({ where: { id: "sat-math" }, create: { id: "sat-math", programId: "sat", slug: "math", title: "Mathematics" }, update: {} });
    await tx.topic.upsert({ where: { id: "sat-algebra" }, create: { id: "sat-algebra", subjectId: "sat-math", slug: "algebra", title: "Algebra" }, update: {} });
    const result = gradePractice({ answers: [0, 0, 0] });
    if (!result) throw new Error("Invalid seed");
    for (const [position, question] of questions.entries()) {
      const stableId = question.id.replace(/-v1$/, "");
      await tx.question.upsert({ where: { id: stableId }, create: { id: stableId, topicId: "sat-algebra" }, update: {} });
      await tx.questionVersion.upsert({
        where: { id: question.id }, update: {},
        create: { id: question.id, questionId: stableId, version: 1, prompt: question.prompt, options: question.options, correct: result.reviews[position].correct, explanation: result.reviews[position].explanation, provenance: "Original EducationPlatform demonstration, 2026-10-22. Pending human editorial review." },
      });
    }
    await tx.exam.upsert({
      where: { id: "sat-algebra-demo-v1" }, update: {},
      create: { id: "sat-algebra-demo-v1", slug: "sat-algebra-demo-v1", programId: "sat", title: "SAT Algebra · Жишиг дасгал", version: 1, scoringVersion: "raw-correct-v1", items: { create: questions.map((q, position) => ({ questionVersionId: q.id, position })) } },
    });
  });
  for (const set of exerciseSets) {
    await db.$transaction(async tx => {
      const programTitle = set.program === "sat" ? "SAT" : set.program === "ielts" ? "IELTS" : "Элсэлтийн шалгалт";
      const subjectSlug = set.program === "sat" ? "math" : set.program === "ielts" ? "english" : set.slug.replace("entrance-", "");
      const subjectId = `${set.program}-${subjectSlug}`;
      await tx.program.upsert({ where: { id: set.program }, update: {}, create: { id: set.program, slug: set.program, title: programTitle } });
      await tx.subject.upsert({ where: { id: subjectId }, update: {}, create: { id: subjectId, programId: set.program, slug: subjectSlug, title: set.program === "entrance" ? set.subject : subjectSlug === "math" ? "Mathematics" : "English" } });
      await tx.topic.upsert({ where: { id: set.slug }, update: {}, create: { id: set.slug, subjectId, slug: set.slug, title: set.subject } });
      for (const q of set.questions) {
        const id = q.id.replace(/-v1$/, "");
        await tx.question.upsert({ where: { id }, update: {}, create: { id, topicId: set.slug } });
        await tx.questionVersion.upsert({ where: { id: q.id }, update: {}, create: {
          id: q.id, questionId: id, version: 1, prompt: q.prompt, options: q.options, correct: q.correct,
          explanation: q.explanation, provenance: "Original EducationPlatform practice, 2026-10-22. Pending independent editorial review; not official exam material.",
        } });
      }
      await tx.exam.upsert({ where: { id: set.examId }, update: {}, create: {
        id: set.examId, slug: set.examId, programId: set.program, title: `${programTitle} · ${set.title}`,
        version: 1, scoringVersion: "raw-correct-v1",
        items: { create: set.questions.map((q, position) => ({ questionVersionId: q.id, position })) },
      } });
    });
  }
  console.log("Seeded legacy SAT sample and 10 practice sets (80 questions); existing versions and student data left unchanged.");
} finally { await db.$disconnect(); }

