import { ApiError, apiFailure, apiUser, privateJson } from "@/lib/api";
import { getWorkshop } from "@/modules/content/published";
import { hasWorkshops } from "@/modules/subscriptions/mock-access";
import { findSubscriptionPlan } from "@/modules/subscriptions/plans";

type Context = { params: Promise<{ slug: string }> };

// The mobile app's counterpart of /workshops/[slug]: the published task, behind the same plan check. Where the
// page shows its plan gate, this answers 402 with `subscribe` naming the plan to open (and the task's title for
// the gate's heading), and nothing of the task itself. Read-only.
export async function GET(request: Request, context: Context) {
  try {
    const user = await apiUser(request);
    const { slug } = await context.params;
    const task = await getWorkshop(slug);
    if (!task) throw new ApiError(404, "Даалгавар олдсонгүй.");
    if (!await hasWorkshops(user.id)) {
      const plan = findSubscriptionPlan("language")!;
      return privateJson({ error: `${plan.title} багцаар IELTS Writing & Speaking workshop-ууд нээгдэнэ.`, subscribe: plan.program, title: task.title }, 402);
    }
    return privateJson({
      task: {
        slug: task.slug, title: task.title, skill: task.skill, minutes: task.minutes, minWords: task.minWords, prompt: task.prompt,
        table: task.table, tips: task.tips, checklist: task.checklist, model: task.model,
      },
    });
  } catch (error) { return apiFailure(error); }
}
