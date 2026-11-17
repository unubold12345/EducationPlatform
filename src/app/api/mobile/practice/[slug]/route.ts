import { ApiError, apiFailure, apiUser, privateJson } from "@/lib/api";
import { speakingLabEnabled } from "@/lib/local-pilot";
import { practiceView, TimedSittingOpen } from "@/modules/exam-practice/service";
import { audioPath, hskQuestionAudio, jlptQuestionAudio } from "@/modules/exams/audio-files";

type Context = { params: Promise<{ slug: string }> };

// The mobile app's counterpart of /exams/[slug]/practice: the practice form with this student's saved answers
// and the results of the questions they already checked, read by the page's own loader (`practiceView`), which
// checks the entitlement and refuses while a timed sitting is open. Nothing of an unchecked question's key,
// explanation or transcript is in it.
// Where the page shows "finish your exam first", this answers 403 with `sitting` (the open sitting's path);
// where the page sends the student back to the exam's briefing, 402 with `exam` (its slug).
// The website builds the recording addresses from modules in its page bundle; the app has no such bundle, so it
// gets the audio route of this mock and, for JLPT and HSK, where each question sits in its part's track.
// Read-only: saves, checks, retries and resets keep their /api/exam-practice routes.
export async function GET(request: Request, context: Context) {
  try {
    const user = await apiUser(request);
    const { slug } = await context.params;
    let view;
    try { view = await practiceView(user.id, slug); }
    catch (error) {
      if (error instanceof TimedSittingOpen) return privateJson({ error: error.message, sitting: error.href }, 403);
      if (error instanceof ApiError && error.status === 402) return privateJson({ error: error.message, exam: slug }, 402);
      throw error;
    }
    const subject = view.form.subject;
    const ranges: Record<string, { start: number; end: number }> = {};
    if (subject === "jlpt" || subject === "hsk") {
      for (const question of view.form.questions) {
        if (!question.audioPart) continue;
        const range = subject === "jlpt" ? jlptQuestionAudio(slug, question.id) : hskQuestionAudio(slug, question.id);
        if (range) ranges[question.id] = { start: range.start, end: range.end };
      }
    }
    return privateJson({
      view,
      speakingLab: speakingLabEnabled(),
      audio: { path: "/api/exam-practice/" + view.form.slug + audioPath(view.form.slug), ranges },
    });
  } catch (error) { return apiFailure(error); }
}
