import { apiFailure, apiUser, privateJson } from "@/lib/api";
import { speakingLabEnabled } from "@/lib/local-pilot";
import { MockAccessRequired } from "@/modules/exams/payments";
import { accessMock } from "@/modules/exams/service";

type Context = { params: Promise<{ id: string }> };

// The mobile app's counterpart of /exams/attempts/[id]/page.tsx: the page's own loader and access check
// (accessMock, which also settles stages whose time has passed) and the two props it hands the runner.
// Where the page redirects to checkout, the app is told which mock needs paying for. Polling and saving
// stay on /api/mock-attempts/[id]. Read-only for the app: no answers, keys or scripts beyond the public attempt.
export async function GET(request: Request, { params }: Context) {
  try {
    const user = await apiUser(request);
    try {
      return privateJson({ attempt: await accessMock((await params).id, user.id), examiner: speakingLabEnabled() });
    } catch (error) {
      if (error instanceof MockAccessRequired) return privateJson({ error: error.message, checkout: error.slug }, 402);
      throw error;
    }
  } catch (error) { return apiFailure(error); }
}
