import "server-only";
// The protected Listening audio handlers. Each route segment (`/audio`, `/audio/forms`) calls these with its own
// recording set and the reader for that set's folder. This module reads no files itself: the build bundles into a
// route only the folder its reader names, and every bundle must stay under Vercel's 250 MB.
import { ApiError, apiFailure, apiUser } from "@/lib/api";
import { accessMock } from "@/modules/exams/service";
import { authorizePracticeAudio } from "@/modules/exam-practice/service";
import { audioSetOf, listeningFile, listeningPosition, type AudioSet } from "@/modules/exams/audio-files";

const notFound = () => new ApiError(404, "Бичлэг олдсонгүй.");
type Respond = (filename: string, request: Request) => Promise<Response>;

/** A timed sitting's recording: only the part playing now, until the attempt is finished. */
export async function attemptAudio(request: Request, id: string, set: AudioSet, respond: Respond) {
  try {
    const user = await apiUser(request); const attempt = await accessMock(id, user.id);
    const part = Number(new URL(request.url).searchParams.get("part"));
    if (!Number.isInteger(part) || part < 1 || part > 4 || !["ielts", "jlpt", "hsk"].includes(attempt.program) || audioSetOf(attempt.slug) !== set) throw notFound();
    const elapsed = (Date.parse(attempt.serverNow) - Date.parse(attempt.stageStartedAt)) / 1000;
    const listeningStage = { jlpt: "jlpt-l", hsk: "hsk-l" }[attempt.program as string] ?? "ielts-listening";
    if (!attempt.finishedAt && (attempt.stage?.id !== listeningStage || part !== listeningPosition(attempt.slug, elapsed, attempt.audioRevision ?? 1).part)) throw new ApiError(403, "Зөвхөн одоо тоглож буй хэсгийн бичлэгийг нээж болно.");
    const filename = listeningFile(attempt.slug, part, attempt.audioRevision ?? 1);
    if (!filename) throw notFound();
    return await respond(filename, request);
  } catch (error) { return apiFailure(error); }
}

/** Practice mode's recording: any part, replayable, after the practice entitlement check. */
export async function practiceAudio(request: Request, slug: string, set: AudioSet, respond: Respond) {
  try {
    const user = await apiUser(request);
    const revision = await authorizePracticeAudio(user.id, slug);
    if (audioSetOf(slug) !== set) throw notFound();
    const filename = listeningFile(slug, Number(new URL(request.url).searchParams.get("part")), revision);
    if (!filename) throw notFound();
    return await respond(filename, request);
  } catch (error) { return apiFailure(error); }
}
