import "server-only";
import { ApiError } from "@/lib/api";
import { speakingLabEnabled } from "@/lib/local-pilot";
import { getExam } from "@/modules/content/published";
import { EXAMINER_SPEED, EXAMINER_VOICE, examinerSpeech, mockReportMessages, mockSpeakingTurns, validExaminerVoiceInput, validMockReportInput } from "@/modules/exams/speaking-examiner";
import { normalizeSpeakingReply } from "@/modules/speaking-lab/contracts";
import { reportTokens, speakingCompletion } from "@/modules/speaking-lab/service";
import { transcribeSpeaking } from "@/modules/speaking-lab/transcribe";
import { speakingVoiceStream } from "@/modules/speaking-lab/voice";
import { practiceResponses, requirePractice } from "./service";

// The Speaking Lab's AI examiner in practice mode's IELTS Speaking sections. It is the scripted examiner of the
// timed mock (exams/speaking-examiner.ts) without a clock. Every request passes practice mode's own checks:
// entitlement to this exam and no open timed sitting.

/** The published IELTS exam this student may practise right now, with the Speaking Lab switched on. */
async function practiceSpeaking(userId: string, slug: string) {
  if (!speakingLabEnabled()) throw new ApiError(404, "AI шалгагч идэвхгүй байна.");
  await requirePractice(userId, slug);
  const definition = await getExam(slug);
  if (!definition || definition.program !== "ielts") throw new ApiError(404, "AI шалгагч зөвхөн IELTS-д ажиллана.");
  return definition;
}

/** Speech for lines of one Speaking section's script. The page names the lines; the text comes from the exam. */
export async function practiceExaminerVoice(userId: string, slug: string, body: unknown) {
  if (!validExaminerVoiceInput(body)) throw new ApiError(400, "Дууны хүсэлтийн бүтэц буруу байна.");
  const definition = await practiceSpeaking(userId, slug);
  const stage = definition.stages.find(item => item.id === body.stageId && item.kind === "speaking");
  if (!stage) throw new ApiError(404, "Speaking хэсэг олдсонгүй.");
  const voice = body.voice ?? EXAMINER_VOICE, text = examinerSpeech(stage, body.say, voice);
  if (!text) throw new ApiError(400, "Шалгагчийн ийм мөр алга.");
  return speakingVoiceStream(userId, { text, voice, speed: EXAMINER_SPEED }, async () => {});
}

/** Transcribes one spoken answer; the practice checks run before and after the model. */
export function practiceExaminerTranscribe(userId: string, slug: string, buffer: ArrayBuffer) {
  return transcribeSpeaking(userId, buffer, async () => { await practiceSpeaking(userId, slug); });
}

/**
 * The AI report on the examiner's transcripts saved in this student's practice session. The conversation is
 * rebuilt on the server from the saved responses; the page sends only the language, target band and timing.
 */
export async function practiceSpeakingReport(userId: string, slug: string, body: unknown) {
  if (!validMockReportInput(body)) throw new ApiError(400, "Тайлангийн хүсэлтийн бүтэц буруу байна.");
  const definition = await practiceSpeaking(userId, slug);
  const { turns, answers } = mockSpeakingTurns(definition.stages, await practiceResponses(userId, slug));
  if (!answers) throw new ApiError(400, "AI шалгагчийн бичвэрлэсэн Speaking хариулт алга.");
  return speakingCompletion(userId, "speaking-report", {
    messages: mockReportMessages(body, turns), maxTokens: reportTokens(body.language), temperature: 0.3, timeoutMs: 80000,
    read: json => { const report = normalizeSpeakingReply(json, "report")?.report; return report ? { report } : null; },
    // Another tab may have started a timed exam while the provider was answering.
    recheck: async () => { await practiceSpeaking(userId, slug); },
  });
}
