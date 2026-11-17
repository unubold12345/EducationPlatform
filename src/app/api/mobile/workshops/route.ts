import { apiFailure, apiUser, privateJson } from "@/lib/api";
import { listeningLabEnabled, readingLabEnabled, speakingLabEnabled, writingLabEnabled } from "@/lib/local-pilot";
import { guidedTasks } from "@/modules/workshops/guided";

// The mobile app's counterpart of /workspace/workshop: which labs are switched on and the list of guided IELTS
// tasks, as the page reads them. Only what the list shows is sent; a task's text is behind the plan check of
// /api/mobile/workshops/[slug]. Read-only.
export async function GET(request: Request) {
  try {
    await apiUser(request);
    return privateJson({
      labs: { speaking: speakingLabEnabled(), writing: writingLabEnabled(), listening: listeningLabEnabled(), reading: readingLabEnabled() },
      tasks: guidedTasks.map(task => ({ slug: task.slug, title: task.title, skill: task.skill, minutes: task.minutes })),
    });
  } catch (error) { return apiFailure(error); }
}
