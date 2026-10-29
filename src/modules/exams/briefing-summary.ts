import { MOCK_PRICE_LABEL } from "./pricing.ts";
import type { ExamDefinition, ExamStage } from "./types.ts";

export type BriefingFact = { label: string; value: string };

export type MockBriefingSummary = {
  eyebrow: string;
  chips: string[];
  facts: BriefingFact[];
  priceNote: string;
  scoreNote: string;
  totalSeconds: number;
  breakSeconds: number;
  deliveredQuestions: number;
};

export function formatExamDuration(seconds: number) {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours}ц${minutes ? " " + minutes + "м" : ""}` : `${minutes}м`;
}

function questionsFor(stage: ExamStage) {
  return stage.variants ? stage.variants.lower.length : stage.questions.length;
}

function uniqueQuestionCount(stages: ExamStage[], kinds: ExamStage["kind"][]) {
  const ids = new Set<string>();
  stages.filter(stage => kinds.includes(stage.kind)).forEach(stage => stage.questions.forEach(question => ids.add(question.id)));
  return ids.size;
}

export function mockBriefingSummary(exam: ExamDefinition): MockBriefingSummary {
  const totalSeconds = exam.stages.reduce((sum, stage) => sum + stage.seconds, 0);
  const breakSeconds = exam.stages.filter(stage => stage.kind === "break").reduce((sum, stage) => sum + stage.seconds, 0);
  const activeSeconds = totalSeconds - breakSeconds;

  if (exam.program === "sat") {
    const deliveredQuestions = exam.stages.reduce((sum, stage) => sum + questionsFor(stage), 0);
    const modules = exam.stages.filter(stage => stage.kind === "questions").length;
    return {
      eyebrow: "FULL MOCK · DIGITAL SAT",
      chips: [`${deliveredQuestions} асуулт`, `${modules} модуль`, `${formatExamDuration(activeSeconds)} + ${breakSeconds / 60}м завсарлага`, "Raw оноо"],
      facts: [
        { label: "Асуулт", value: `${deliveredQuestions}` },
        { label: "Модуль", value: `${modules} + ${breakSeconds / 60}м завсарлага` },
        { label: "Хугацаа", value: `${formatExamDuration(totalSeconds)} нийт` },
        { label: "Үр дүн", value: "Raw оноо" },
      ],
      priceNote: `${MOCK_PRICE_LABEL} эсвэл SAT эрх`,
      scoreNote: "SAT raw оноо; 1600 хөрвүүлэлтгүй.",
      totalSeconds,
      breakSeconds,
      deliveredQuestions,
    };
  }

  const readingListening = uniqueQuestionCount(exam.stages, ["listening", "questions"]);
  const writingTasks = exam.stages.filter(stage => stage.kind === "writing").reduce((sum, stage) => sum + stage.questions.length, 0);
  const speakingStages = exam.stages.filter(stage => stage.kind === "speaking").length;
  return {
    eyebrow: "FULL MOCK · IELTS ACADEMIC",
    chips: [`${readingListening} асуулт`, `${writingTasks} бичих даалгавар`, `${speakingStages} Speaking хэсэг`, "Band биш"],
    facts: [
      { label: "Асуулт", value: `${readingListening} + ${writingTasks} даалгавар` },
      { label: "Чадвар", value: "4" },
      { label: "Хугацаа", value: formatExamDuration(totalSeconds) },
      { label: "Үр дүн", value: "Listen/Read оноо" },
    ],
    priceNote: `${MOCK_PRICE_LABEL} эсвэл IELTS эрх`,
    scoreNote: "Writing, Speaking-д автомат band өгөхгүй.",
    totalSeconds,
    breakSeconds,
    deliveredQuestions: readingListening,
  };
}
