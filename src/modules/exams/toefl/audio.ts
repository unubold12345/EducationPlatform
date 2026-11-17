import "server-only";
// TOEFL recordings are one clip per item, not part tracks, so they have their own handlers beside audio-handlers.ts.
// This module reads no files; the `/audio/toefl` routes pass the reader for assets/toefl-audio.
import { ApiError, apiFailure, apiUser } from "@/lib/api";
import { accessMock } from "@/modules/exams/service";
import { authorizePracticeAudio } from "@/modules/exam-practice/service";
import { isToeflSlug, toeflClips, toeflPlayingClip } from "./catalog";

const notFound = () => new ApiError(404, "Бичлэг олдсонгүй.");
type Respond = (filename: string, request: Request) => Promise<Response>;
/** The file name of an allowlisted clip of this form, or undefined: no request text reaches a path. */
function clipFile(slug: string, clip: string | null) {
  return clip && isToeflSlug(slug) && toeflClips(slug).includes(clip) ? `${slug}-${clip}.mp3` : undefined;
}

/** A timed sitting's clip: only the one playing now on the route the attempt took, until the attempt is finished; then any clip of the form. */
export async function toeflAttemptAudio(request: Request, id: string, respond: Respond) {
  try {
    const user = await apiUser(request); const attempt = await accessMock(id, user.id);
    const clip = new URL(request.url).searchParams.get("clip");
    const filename = attempt.program === "toefl" ? clipFile(attempt.slug, clip) : undefined;
    if (!filename) throw notFound();
    if (!attempt.finishedAt) {
      const stage = attempt.stage;
      const elapsed = (Date.parse(attempt.serverNow) - Date.parse(attempt.stageStartedAt)) / 1000;
      if (!stage || toeflPlayingClip(attempt.slug, stage.id, stage.questions.map(question => question.id), elapsed) !== clip) throw new ApiError(403, "Зөвхөн одоо тоглож буй бичлэгийг нээж болно.");
    }
    return await respond(filename, request);
  } catch (error) { return apiFailure(error); }
}

/** Practice mode's clip: any clip of the form, replayable, after the practice entitlement check. */
export async function toeflPracticeAudio(request: Request, slug: string, respond: Respond) {
  try {
    const user = await apiUser(request);
    await authorizePracticeAudio(user.id, slug);
    const filename = clipFile(slug, new URL(request.url).searchParams.get("clip"));
    if (!filename) throw notFound();
    return await respond(filename, request);
  } catch (error) { return apiFailure(error); }
}
