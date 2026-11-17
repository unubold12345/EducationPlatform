import { ApiError, apiFailure, apiUser, privateJson } from "@/lib/api";
import { speakingLabEnabled } from "@/lib/local-pilot";
import { getExam } from "@/modules/content/published";
import { listeningParts } from "@/modules/exams/audio-files";
import { mockBriefingSummary } from "@/modules/exams/briefing-summary";
import { entranceSubjectLabels, findEntranceMeta } from "@/modules/exams/entrance/catalog";
import { findFreeMock } from "@/modules/exams/free/catalog";
import { MOCK_PRICE_LABEL } from "@/modules/exams/pricing";
import type { ExamDefinition, ExamStage } from "@/modules/exams/types";
import { briefingAccess } from "@/modules/subscriptions/briefing-access";
import type { BriefingGate, BriefingReply, BriefingStage } from "../../contracts";

type Context = { params: Promise<{ slug: string }> };

// The mobile app's counterpart of a mock's briefing page (src/app/exams/[slug]/page.tsx and the JLPT, HSK and
// ЭЕШ briefings it hands over to). It loads the mock with getExam() and decides access with briefingAccess(),
// exactly as the page does, and returns only what the page prints: titles, counts, durations and the access
// state. The definition itself (questions, keys, explanations, listening scripts) never leaves the server here.
// Read-only: starting uses POST /api/mock-attempts and picking POST /api/mock-picks, which decide again.

function stageDetail(stage: ExamStage) {
  if (stage.kind === "break") return "Асуултгүй завсарлага";
  if (stage.kind === "preparation") return "Бэлтгэлийн минут";
  if (stage.kind === "writing") return stage.questions.length + " даалгавар";
  if (stage.kind === "speaking") return stage.questions.length + " асуулт";
  if (stage.id === "ielts-listening-check") return stage.questions.length + " хариултаа шалгах";
  return (stage.variants ? stage.variants.lower.length : stage.questions.length) + " асуулт";
}
const counted = (stage: ExamStage): BriefingStage => ({ id: stage.id, kind: stage.kind, title: stage.title, detail: stage.questions.length + " асуулт", minutes: stage.seconds / 60 });
const totalMinutes = (exam: ExamDefinition) => exam.stages.reduce((sum, stage) => sum + stage.seconds, 0) / 60;
const recordedMinutes = (slug: string) => Math.ceil(listeningParts(slug).reduce((sum, seconds) => sum + seconds, 0) / 60);

const entranceStructure: Record<string, string> = {
  math: "36 сонгох + 4 бодолт",
  physics: "46 сонгох + 4 бодолт",
  chemistry: "40 сонгох + 4 бүтээх даалгавар",
  biology: "A–E сонгох + 4 бүтээх даалгавар",
  english: "Part I + Part II",
};

export async function GET(request: Request, { params }: Context) {
  try {
    const user = await apiUser(request);
    const slug = (await params).slug;
    const exam = slug.length <= 80 ? await getExam(slug) : undefined;
    if (!exam) throw new ApiError(404, "Шалгалт олдсонгүй.");
    // Free, bought, a plan, or this Гадаад хэл plan month's pick; the API checks the same rules again on every request.
    const access = await briefingAccess(user.id, exam.slug, exam.program);
    const gate: BriefingGate = {
      hasAccess: access.hasAccess, practice: access.practice, free: access.free, pick: access.pick, pickedUntil: access.pickedUntil,
      plan: access.plan, activeAttemptId: access.activeAttemptId ?? null, locked: access.locked ?? null, access: access.access.kind,
    };
    const base = { slug: exam.slug, program: exam.program, gate, sources: exam.sources ?? [] };
    let reply: BriefingReply;

    if (exam.program === "jlpt") {
      const level = exam.slug.includes("-n4-") ? "N4" : "N5";
      reply = {
        ...base, kind: "jlpt", level, title: exam.title,
        eyebrow: `日本語 · ${level} · ${gate.free ? "ҮНЭГҮЙ ХАГАС MOCK" : "БҮТЭН MOCK"}`,
        description: "Үгийн сан → хэлзүй, унших → сонсох. Албан бүтцээр бэлдэж, алдсан чадвараа цаггүй горимд давтаарай.",
        chips: [`${exam.points} асуулт`, `${totalMinutes(exam)} минут`], facts: [], priceNote: gate.free ? "Үнэгүй" : MOCK_PRICE_LABEL,
        stages: exam.stages.map(counted), listeningParts: listeningParts(exam.slug).length, listeningMinutes: recordedMinutes(exam.slug),
      };
    } else if (exam.program === "hsk") {
      const heard = exam.stages.find(stage => stage.id === "hsk-l")?.questions.length ?? 20;
      const read = exam.stages.find(stage => stage.id === "hsk-r")?.questions.length ?? 20;
      reply = {
        ...base, kind: "hsk", title: exam.title,
        eyebrow: `汉语水平考试 · HSK 1 · ${gate.free ? "ҮНЭГҮЙ ХАГАС MOCK" : "БҮТЭН MOCK"}`,
        description: `${exam.description}. Сонсох → унших. Албан бүтцээр бэлдэж, алдсан хэсгээ цаггүй горимд давтаарай.`,
        chips: [`${exam.points} асуулт`, `${totalMinutes(exam)} минут`], facts: [], priceNote: gate.free ? "Үнэгүй" : MOCK_PRICE_LABEL,
        stages: exam.stages.map(counted), listeningMinutes: recordedMinutes(exam.slug), heard, read, perItem: Number((100 / Math.max(1, heard)).toFixed(2)),
      };
    } else if (exam.program === "entrance") {
      const sample = findFreeMock(exam.slug);
      // A free paper is not one of a year's forms, so it reads as "Үнэгүй туршилт" instead of a year and form.
      const meta = findEntranceMeta(exam.slug) ?? (sample ? { year: "Үнэгүй", form: "хагас хэмжээ", durationMinutes: sample.minutes, points: sample.points } : undefined);
      if (!meta || !exam.subject) throw new ApiError(404, "Шалгалт олдсонгүй.");
      const stage = exam.stages[0];
      const choice = stage.questions.filter(question => question.kind === "choice").length;
      const typed = stage.questions.length - choice;
      const tasks = stage.groups?.filter(group => group.pageMode === "group").length ?? 0;
      const label = entranceSubjectLabels[exam.subject];
      reply = {
        ...base, kind: "entrance", subject: exam.subject, title: `${meta.year} · ${meta.form}`,
        eyebrow: `ЭЕШ · ${label.toUpperCase()} · ${meta.year}`, description: exam.description,
        chips: [`${stage.questions.length} даалгавар`, typed ? `${choice} сонгох + ${typed} бичих` : `${choice} хариулт`, `${meta.durationMinutes} минут`, `${meta.points} оноо`],
        structure: tasks ? `${entranceStructure[exam.subject] ?? ""}${typed ? ` · ${typed} дэд асуулт` : ""}` : "",
        facts: [
          { label: "Хөтөлбөр", value: label }, { label: "Он · хувилбар", value: `${meta.year} · ${meta.form}` },
          { label: "Даалгавар", value: String(stage.questions.length) }, { label: "Хугацаа", value: `${meta.durationMinutes} минут` },
          { label: "Оноо", value: String(meta.points) }, { label: "Тооцоолуур", value: exam.subject === "english" ? "Шаардлагагүй" : "Хэрэглэхгүй" },
        ],
        priceNote: gate.free ? "Үнэгүй · бүртгэлтэй бүх хүнд" : "₮10,000 эсвэл ЭЕШ багц",
        stages: exam.stages.map(item => ({ id: item.id, kind: item.kind, title: item.title, detail: item.questions.length + " даалгавар", minutes: item.seconds / 60 })),
        notes: exam.notes ?? [], sourceNote: exam.sourceNote ?? "",
      };
    } else {
      const summary = mockBriefingSummary(exam);
      const shared = {
        ...base, title: exam.title, description: exam.description, eyebrow: summary.eyebrow, chips: summary.chips, facts: summary.facts, priceNote: summary.priceNote,
        stages: exam.stages.map((stage): BriefingStage => ({ id: stage.id, kind: stage.kind, title: stage.title, detail: stageDetail(stage), minutes: stage.seconds / 60 })),
      };
      reply = exam.program === "sat" ? { ...shared, kind: "sat" } : {
        ...shared, kind: "ielts", examiner: speakingLabEnabled(),
        speakingMinutes: exam.stages.filter(stage => stage.kind === "speaking" || stage.kind === "preparation").reduce((sum, stage) => sum + stage.seconds, 0) / 60,
      };
    }
    return privateJson(reply);
  } catch (error) { return apiFailure(error); }
}
